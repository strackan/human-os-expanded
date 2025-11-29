# Workspace System Restoration Plan
**Date**: 2025-01-29
**Status**: Ready to implement
**Current State**: Authentication working without workspace features

## Background

We removed workspace profile fetching from `AuthProvider.tsx` to fix an authentication hanging issue. The root cause was a React useEffect infinite loop caused by the Supabase client being re-instantiated on every render.

**What we removed:**
- Profile fetching (status, is_admin, company_id)
- Workspace status checking (0=Disabled, 1=Active, 2=Pending)
- Company auto-creation for first-time users
- Admin role assignment

**Current working commit**: `1a623fd` - Basic OAuth authentication works

## Critical Lessons Learned

1. **Never block auth flow with database queries** - Auth loading should complete regardless of profile fetch status
2. **Memoize expensive operations** - Use `useMemo` for Supabase client creation
3. **Handle errors gracefully** - Database failures shouldn't block login
4. **Test incrementally** - Deploy and verify after each change

## Phase 1: Add Profile Fetching (Non-Blocking)

### Step 1.1: Update AuthContext Interface

**File**: `src/components/auth/AuthProvider.tsx`

**Changes**:
```typescript
// Add back to interface
interface UserProfile {
  id: string
  email: string
  full_name: string | null
  company_id: string | null
  status: number
  is_admin: boolean
}

interface AuthContextType {
  user: User | null
  profile: UserProfile | null  // ← Add this back
  loading: boolean
  signOut: () => Promise<void>
}

// Update initial context
const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,  // ← Add this back
  loading: true,
  signOut: async () => {},
})
```

**Test checkpoint**: Should compile without errors

---

### Step 1.2: Add Profile State and Memoized Client

**File**: `src/components/auth/AuthProvider.tsx`

**Changes**:
```typescript
export default function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)  // ← Add this back
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  // CRITICAL: Memoize to prevent re-instantiation
  const supabase = useMemo(() => createClient(), [])
```

**Test checkpoint**: Should compile, auth still works

---

### Step 1.3: Add Non-Blocking Profile Fetch Function

**File**: `src/components/auth/AuthProvider.tsx`

**Add this function** (but DON'T call it yet):

```typescript
// Helper: Fetch user profile WITHOUT blocking auth flow
const fetchUserProfile = async (authUser: User): Promise<void> => {
  try {
    console.log('[PROFILE] Fetching profile for:', authUser.email)

    const { data: existingProfile, error: profileError } = await supabase
      .from('profiles')
      .select('id, email, full_name, company_id, status, is_admin')
      .eq('id', authUser.id)
      .single()

    if (profileError) {
      if (profileError.code === 'PGRST116') {
        // Profile doesn't exist - create it
        console.log('[PROFILE] No profile found, creating...')
        await createUserProfile(authUser)
        return
      }

      // Try without workspace columns for backward compatibility
      console.log('[PROFILE] Retrying without workspace columns...')
      const { data: basicProfile, error: basicError } = await supabase
        .from('profiles')
        .select('id, email, full_name, company_id')
        .eq('id', authUser.id)
        .single()

      if (basicError) {
        console.error('[PROFILE] Failed to fetch profile:', basicError)
        // Don't set profile - user can still use the app
        return
      }

      // Use basic profile with default workspace values
      setProfile({
        ...basicProfile,
        status: 1,
        is_admin: false
      } as UserProfile)
      return
    }

    console.log('[PROFILE] Profile loaded:', {
      status: existingProfile.status,
      is_admin: existingProfile.is_admin,
      has_company: !!existingProfile.company_id
    })

    // Check if user is disabled
    if (existingProfile.status === 0) {
      console.log('[PROFILE] User is disabled')
      router.push('/no-access')
      return
    }

    // Activate pending users
    if (existingProfile.status === 2) {
      console.log('[PROFILE] Activating pending user')
      const { data: activated } = await supabase
        .from('profiles')
        .update({ status: 1 })
        .eq('id', authUser.id)
        .select('id, email, full_name, company_id, status, is_admin')
        .single()

      if (activated) {
        setProfile(activated)
      }
      return
    }

    // Set active profile
    setProfile(existingProfile)
  } catch (error) {
    console.error('[PROFILE] Error fetching profile:', error)
    // Don't throw - let user continue without profile
  }
}
```

**Test checkpoint**: Should compile, nothing changed in behavior yet

---

### Step 1.4: Add Profile Creation Function

**File**: `src/components/auth/AuthProvider.tsx`

**Add this function**:

```typescript
// Helper: Create profile for new user
const createUserProfile = async (authUser: User): Promise<void> => {
  try {
    console.log('[PROFILE] Creating new profile for first-time user')

    // Check if any profiles exist - if not, this is the first user
    const { count } = await supabase
      .from('profiles')
      .select('id', { count: 'exact', head: true })

    const isFirstUser = count === 0

    let companyId = null

    // Create company if this is the first user
    if (isFirstUser) {
      console.log('[PROFILE] First user - creating company')
      const companyName = authUser.email?.split('@')[1] || 'My Company'

      const { data: newCompany, error: companyError } = await supabase
        .from('companies')
        .insert({ name: companyName })
        .select()
        .single()

      if (companyError) {
        console.error('[PROFILE] Error creating company:', companyError)
        // Continue without company
      } else {
        companyId = newCompany.id
      }
    }

    // Create profile
    const { data: newProfile, error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: authUser.id,
        email: authUser.email!,
        full_name: authUser.user_metadata?.full_name || authUser.user_metadata?.name,
        company_id: companyId,
        status: 1, // Active
        is_admin: isFirstUser // First user is admin
      })
      .select('id, email, full_name, company_id, status, is_admin')
      .single()

    if (profileError) {
      console.error('[PROFILE] Error creating profile:', profileError)
      return
    }

    console.log('[PROFILE] Profile created successfully')
    setProfile(newProfile)
  } catch (error) {
    console.error('[PROFILE] Error in createUserProfile:', error)
  }
}
```

**Test checkpoint**: Should compile, nothing changed yet

---

### Step 1.5: Call Profile Fetch in Background (Non-Blocking)

**File**: `src/components/auth/AuthProvider.tsx`

**Modify the useEffect**:

```typescript
useEffect(() => {
  const mountTime = performance.now()
  console.log('⏱️ [AUTH] Provider mounted at', new Date().toISOString())

  const getUser = async () => {
    console.log('⏱️ [AUTH] Starting initial session fetch...')
    const start = performance.now()

    try {
      const { data: { session } } = await supabase.auth.getSession()
      setUser(session?.user ?? null)
      console.log('⏱️ [AUTH] Session fetch result:', {
        hasUser: !!session?.user,
        userEmail: session?.user?.email,
      })

      // CRITICAL: Set loading to false IMMEDIATELY after getting session
      // Don't wait for profile fetch
      setLoading(false)

      // Fetch profile in background (non-blocking)
      if (session?.user) {
        fetchUserProfile(session.user)  // ← Call in background, don't await
      }
    } catch (error) {
      console.error('❌ [AUTH] Error loading user:', error)
      setUser(null)
      setLoading(false)  // ← Still set loading to false even on error
    } finally {
      const end = performance.now()
      console.log(`⏱️ [AUTH] Initial session fetch took ${(end - start).toFixed(2)} ms`)
    }
  }

  getUser()

  const { data: { subscription } } = supabase.auth.onAuthStateChange(
    async (event, session) => {
      const eventTime = performance.now()
      console.log('⏱️ [AUTH] Auth state change:', {
        event,
        hasUser: !!session?.user,
        userEmail: session?.user?.email,
        elapsedMs: (eventTime - mountTime).toFixed(2),
      })

      setUser(session?.user ?? null)
      setLoading(false)  // ← Set loading false immediately

      if (event === 'SIGNED_IN' && session?.user) {
        // Fetch profile in background
        fetchUserProfile(session.user)  // ← Don't await
        router.refresh()
      } else if (event === 'SIGNED_OUT') {
        setProfile(null)
        router.push('/signin')
      }
    }
  )

  return () => {
    subscription.unsubscribe()
    console.log('⏱️ [AUTH] Provider unmounted at', new Date().toISOString())
  }
}, [supabase, router])  // ← Keep dependencies (supabase is memoized)
```

**CRITICAL CHANGE**: `setLoading(false)` happens IMMEDIATELY after getting the session, NOT after profile fetch completes.

**Test checkpoint**:
- Deploy and test
- Authentication should still work instantly
- Profile will load in background (check console logs)
- Page should render even if profile fetch fails

---

### Step 1.6: Update Context Value

**File**: `src/components/auth/AuthProvider.tsx`

**Changes**:
```typescript
const value = useMemo(
  () => ({ user, profile, loading, signOut }),  // ← Add profile back
  [user, profile, loading]  // ← Add profile to dependencies
)
```

**Test checkpoint**: Should compile and work

---

## Phase 2: Restore Team Settings Admin Checks

### Step 2.1: Update Team Settings Page

**File**: `src/app/settings/team/page.tsx`

**Changes**:
```typescript
export default function TeamManagementPage() {
  const { user, profile, loading: authLoading } = useAuth()  // ← Add profile back

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.push('/signin')
        return
      }

      // Check if profile has loaded yet
      if (!profile) {
        console.log('[TEAM] Waiting for profile to load...')
        return  // Wait for profile
      }

      // Check admin status
      if (!profile.is_admin) {
        console.log('[TEAM] User is not admin, redirecting')
        router.push('/dashboard')
        return
      }

      // User is authenticated and admin
      fetchTeamMembers()
    }
  }, [authLoading, user, profile, router])  // ← Add profile to dependencies

  // ... rest of component

  // Update the check for disabling self-modification
  {member.id !== profile?.id && (  // ← Already correct from our previous fix
    <div className="flex space-x-2">
      {/* ... admin controls ... */}
    </div>
  )}
}
```

**Test checkpoint**: Team settings should only be accessible to admins

---

## Phase 3: Update Staging Branch

### Step 3.1: Merge Main to Staging

```bash
git checkout justin-strackany
git merge main
git push origin justin-strackany
```

### Step 3.2: Verify Staging Deployment

Test on staging URL to ensure everything works before promoting to main.

---

## Testing Checklist

After each phase, verify:

### Authentication Tests
- [ ] Can sign in with Google on production
- [ ] Can sign in with Google on staging
- [ ] Dashboard loads immediately (no hanging)
- [ ] Sign out works correctly
- [ ] Redirect after login works

### Profile Tests (After Phase 1)
- [ ] Profile data loads in background
- [ ] Console shows profile fetch logs
- [ ] Page renders even if profile fails to load
- [ ] First-time user gets company created
- [ ] First-time user becomes admin
- [ ] Subsequent users join existing company
- [ ] Disabled users (status=0) redirected to /no-access
- [ ] Pending users (status=2) get activated on login

### Team Settings Tests (After Phase 2)
- [ ] Non-admin users cannot access team settings
- [ ] Admin users can access team settings
- [ ] Admin can invite new users
- [ ] Admin can promote/demote other users
- [ ] Admin cannot modify their own status
- [ ] Team member list displays correctly

---

## Rollback Plan

If anything breaks:

### Quick Rollback
```bash
git revert HEAD
git push origin main
```

### Full Rollback to Working State
```bash
git reset --hard 1a623fd  # Current working commit
git push origin main --force
```

---

## Success Criteria

✅ Authentication works instantly (no hanging)
✅ Profile data loads in background
✅ First-time users get company + admin status
✅ Team settings restricted to admins
✅ All tests pass on both production and staging

---

## Next Session Checklist

Before starting:
1. [ ] Verify production is still working (commit 1a623fd)
2. [ ] Have Vercel dashboard open for quick deployments
3. [ ] Have Supabase dashboard open for checking database
4. [ ] Review this plan thoroughly
5. [ ] Start with Phase 1, Step 1.1
6. [ ] Test after EVERY step before proceeding

**Estimated time**: 2-3 hours if done carefully with testing at each step

---

## Notes

- The key difference from the broken version: **loading state completes immediately**, profile fetches in background
- Error handling: If profile fetch fails, user can still use the app (just without workspace features)
- Memoization: Supabase client is memoized to prevent the infinite loop that caused the original issue
