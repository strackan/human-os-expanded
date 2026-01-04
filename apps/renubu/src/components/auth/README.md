# In-Workflow Authentication

A comprehensive, reusable authentication system for embedding within workflow modals, artifacts, or any in-page flow where you don't want to redirect users away from their current context.

## Features

- ✅ **Email/Password Auth** - Inline sign in & sign up (no redirect)
- ✅ **Google OAuth** - Popup window pattern (preserves parent window state)
- ✅ **Session Preservation** - User stays at exact workflow step
- ✅ **Error Handling** - Clear error messages and fallbacks
- ✅ **Loading States** - Professional UX during authentication
- ✅ **Customizable** - Props for title, description, callbacks
- ✅ **TypeScript** - Full type safety

## Quick Start

### 1. Basic Usage

```tsx
import InWorkflowAuth from '@/components/auth/InWorkflowAuth';
import { useInWorkflowAuth } from '@/components/auth/useInWorkflowAuth';

function MyWorkflow() {
  const { user, isAuthenticated, isLoading } = useInWorkflowAuth();

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!isAuthenticated) {
    return (
      <InWorkflowAuth
        onAuthSuccess={(user) => {
          console.log('User authenticated:', user.email);
          // Continue with workflow...
        }}
      />
    );
  }

  // User is authenticated, show workflow content
  return (
    <div>
      <h1>Welcome, {user.email}!</h1>
      {/* Your workflow content */}
    </div>
  );
}
```

### 2. In a Modal or Sidebar

```tsx
import InWorkflowAuth from '@/components/auth/InWorkflowAuth';

function WorkflowModal({ isOpen, onClose }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="flex">
        {/* Left: Workflow Content */}
        <div className="flex-1">
          <h2>Your Workflow</h2>
          {/* Workflow steps... */}
        </div>

        {/* Right: Auth Panel (conditionally shown) */}
        {!isAuthenticated && (
          <div className="w-96 border-l">
            <InWorkflowAuth
              title="Sign in to save progress"
              description="Your work will be saved to your account"
              onAuthSuccess={() => setIsAuthenticated(true)}
            />
          </div>
        )}
      </div>
    </Modal>
  );
}
```

### 3. Conditional Step in Multi-Step Flow

```tsx
function MultiStepWorkflow() {
  const [step, setStep] = useState(1);
  const { isAuthenticated } = useInWorkflowAuth();

  if (step === 3 && !isAuthenticated) {
    return (
      <div className="max-w-md mx-auto">
        <InWorkflowAuth
          title="Sign in to continue"
          description="You've completed the first steps! Create an account to continue."
          onAuthSuccess={() => setStep(4)}
        />
      </div>
    );
  }

  // Show appropriate step
  return <StepContent step={step} />;
}
```

## Component API

### `<InWorkflowAuth>`

#### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `onAuthSuccess` | `(user: User) => void` | - | Callback when user successfully authenticates |
| `onAuthError` | `(error: string) => void` | - | Callback when authentication fails |
| `title` | `string` | `"Sign in to continue"` | Header text |
| `description` | `string` | `"Create an account or sign in..."` | Subheader text |
| `showSignUp` | `boolean` | `true` | Show "Create account" toggle |
| `className` | `string` | `""` | Additional CSS classes |

#### Example

```tsx
<InWorkflowAuth
  onAuthSuccess={(user) => {
    console.log('Authenticated:', user.email);
    saveWorkflowData(user.id);
    continueToNextStep();
  }}
  onAuthError={(error) => {
    console.error('Auth failed:', error);
    showErrorToast(error);
  }}
  title="Welcome back!"
  description="Sign in to access your saved workflows"
  showSignUp={true}
  className="shadow-lg"
/>
```

## Hook API

### `useInWorkflowAuth()`

Returns authentication state and user data.

#### Return Value

```tsx
{
  user: User | null,        // Supabase user object
  isAuthenticated: boolean, // True if user is logged in
  isLoading: boolean        // True while checking session
}
```

#### Example

```tsx
function MyComponent() {
  const { user, isAuthenticated, isLoading } = useInWorkflowAuth();

  if (isLoading) return <Spinner />;
  if (!isAuthenticated) return <AuthRequired />;

  return <Content user={user} />;
}
```

## How It Works

### Email/Password Authentication

1. User enters email and password
2. Component calls `supabase.auth.signInWithPassword()` or `signUp()`
3. Session is created immediately (no page refresh)
4. `onAuthSuccess` callback fires with user data
5. Parent component continues workflow

### Google OAuth (Popup Pattern)

1. User clicks "Continue with Google"
2. OAuth URL is opened in a popup window (`window.open()`)
3. User authenticates with Google in the popup
4. Google redirects to `/auth/callback?mode=popup`
5. Callback page sends `postMessage()` to parent window
6. Popup closes automatically
7. Parent receives message and continues workflow

```
┌─────────────────────────────┐
│  Parent Window (Workflow)   │
│  ┌─────────────────────┐    │
│  │ <InWorkflowAuth />  │    │
│  │  [Google Button]    │    │
│  └─────────────────────┘    │
└─────────────────────────────┘
           │
           │ window.open()
           ▼
┌─────────────────────────────┐
│    Popup Window (OAuth)     │
│  ┌─────────────────────┐    │
│  │   Google Sign In    │    │
│  └─────────────────────┘    │
└─────────────────────────────┘
           │
           │ postMessage()
           ▼
┌─────────────────────────────┐
│  Parent Window (Workflow)   │
│  [Auth Complete ✓]          │
│  [Continue Workflow...]     │
└─────────────────────────────┘
```

## Security Considerations

### Origin Validation

The component validates `postMessage` origin to prevent XSS attacks:

```tsx
if (event.origin !== window.location.origin) {
  console.warn('Received message from untrusted origin');
  return;
}
```

### Popup Blockers

If the popup is blocked by the browser:
- Component shows error: "Popup blocked. Please allow popups for this site."
- User can re-attempt or use email/password instead

### Session Refresh

After OAuth success, the component calls `supabase.auth.getSession()` to ensure session is properly restored in the parent window.

## Styling

The component uses Tailwind CSS and matches Renubu's design system. You can customize appearance with the `className` prop:

```tsx
<InWorkflowAuth
  className="border-2 border-blue-500 shadow-xl"
  // ...
/>
```

## Error Handling

The component handles common errors gracefully:

- **Invalid credentials** - "Incorrect email or password"
- **Weak password** - "Password must be at least 8 characters"
- **Email already exists** - "A user with this email already exists"
- **Popup blocked** - "Popup blocked. Please allow popups for this site."
- **OAuth failure** - Specific error message from provider
- **Network errors** - "Failed to connect. Please try again."

## Browser Support

- ✅ Chrome/Edge (latest)
- ✅ Firefox (latest)
- ✅ Safari (latest)
- ⚠️ Mobile browsers (OAuth may open in new tab instead of popup)

## Testing

```tsx
// Mock authentication for testing
import { createClient } from '@/lib/supabase/client';

jest.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    auth: {
      signInWithPassword: jest.fn().mockResolvedValue({ data: { user: mockUser } }),
      getSession: jest.fn().mockResolvedValue({ data: { session: mockSession } }),
    },
  }),
}));
```

## Common Patterns

### Save Workflow State Before Auth

```tsx
function MyWorkflow() {
  const [workflowData, setWorkflowData] = useState({});

  const handleAuthSuccess = async (user) => {
    // Save accumulated workflow data to user account
    await saveToDatabase(user.id, workflowData);
    continueWorkflow();
  };

  return (
    <InWorkflowAuth
      onAuthSuccess={handleAuthSuccess}
      title="Almost done! Sign in to save your work"
    />
  );
}
```

### Progressive Authentication

```tsx
function MultiStepForm() {
  const steps = ['Info', 'Details', 'Review', 'Auth', 'Submit'];
  const [currentStep, setCurrentStep] = useState(0);

  // Only require auth at step 3
  if (currentStep === 3) {
    return (
      <InWorkflowAuth
        onAuthSuccess={() => setCurrentStep(4)}
        title="Sign in to submit"
      />
    );
  }

  return <FormStep step={currentStep} />;
}
```

### Check Auth Before Showing Protected Content

```tsx
function WorkflowWithProtectedStep() {
  const { isAuthenticated, isLoading } = useInWorkflowAuth();
  const [currentStep, setCurrentStep] = useState(1);

  // Don't show step 5 if not authenticated
  if (currentStep === 5 && !isAuthenticated) {
    return (
      <InWorkflowAuth
        onAuthSuccess={() => {
          // User is now authenticated, continue to step 5
          setCurrentStep(5);
        }}
      />
    );
  }

  return <WorkflowStep step={currentStep} />;
}
```

## File Locations

All authentication components are in `src/components/auth/`:

```
src/components/auth/
├── InWorkflowAuth.tsx          # Main component
├── useInWorkflowAuth.ts        # React hook
└── README.md                   # This file
```

Auth callback handler:
```
src/app/auth/callback/route.ts  # Handles OAuth redirects & popup mode
```

## Support

For questions or issues:
1. Check this README
2. Review code comments in `InWorkflowAuth.tsx`
3. Test with the examples above
4. Contact the Renubu engineering team

---

**Last Updated:** 2025-01-13
**Version:** 1.0.0
**Maintainer:** Renubu Engineering
