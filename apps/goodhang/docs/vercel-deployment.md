# Deploying Good Hang to Vercel with Dreamhost DNS

This is the **recommended approach** - host the Next.js app on Vercel (optimized for Next.js) and point your Dreamhost domain to it.

---

## Part 1: Deploy to Vercel

### Step 1: Push Code to GitHub

1. Initialize git in your project (if not already done):
```bash
cd C:\Users\strac\dev\goodhang\goodhang-web
git init
git add .
git commit -m "Initial commit - Good Hang site"
```

2. Create a new repository on GitHub:
   - Go to https://github.com/new
   - Name it "goodhang-web" (or whatever you prefer)
   - Don't initialize with README (you already have code)

3. Push your code:
```bash
git remote add origin https://github.com/YOUR_USERNAME/goodhang-web.git
git branch -M main
git push -u origin main
```

### Step 2: Deploy to Vercel

1. Go to https://vercel.com/signup and sign up with GitHub

2. Click "Add New Project"

3. Import your "goodhang-web" repository

4. **IMPORTANT**: Add Environment Variables before deploying:
   - Click "Environment Variables"
   - Add each variable from your `.env.local` file:
     - `NEXT_PUBLIC_SUPABASE_URL`
     - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
     - `NEXT_PUBLIC_TYPEFORM_FORM_ID` (if ready)

5. Configure build settings (usually auto-detected):
   - **Framework Preset**: Next.js
   - **Build Command**: `npm run build`
   - **Install Command**: `npm install`

6. Click "Deploy"

7. Wait 2-3 minutes for deployment to complete ✅

---

## Part 2: Configure Custom Domain on Vercel

### Step 1: Add Domain in Vercel

1. In your Vercel project dashboard, go to **Settings** → **Domains**

2. Add your domain:
   - Enter: `goodhang.club`
   - Click "Add"

3. Vercel will show you DNS records to configure:
   - **A Record**: `76.76.21.21` (Vercel's IP)
   - **CNAME Record**: `cname.vercel-dns.com`

---

## Part 3: Configure Dreamhost DNS

### Option A: Full Vercel Control (Recommended)

1. Log into Dreamhost Panel: https://panel.dreamhost.com

2. Go to **Domains** → **Manage Domains**

3. Find `goodhang.club` and click **DNS** (under the domain)

4. Look for the **Nameservers** section

5. Change nameservers to Vercel's:
   - `ns1.vercel-dns.com`
   - `ns2.vercel-dns.com`

6. Save changes

7. Wait 24-48 hours for propagation (usually takes 1-2 hours)

### Option B: Keep Dreamhost DNS, Add Records

If you want to keep email hosting on Dreamhost:

1. Log into Dreamhost Panel

2. Go to **Domains** → **Manage Domains** → **DNS** for `goodhang.club`

3. Add these records:

   **For Root Domain (goodhang.club)**:
   ```
   Type: A
   Name: @
   Value: 76.76.21.21
   TTL: Auto or 3600
   ```

   **For WWW subdomain (www.goodhang.club)**:
   ```
   Type: CNAME
   Name: www
   Value: cname.vercel-dns.com
   TTL: Auto or 3600
   ```

4. **Remove any conflicting records**:
   - Delete existing A record for `@` if it exists
   - Delete existing CNAME for `www` if it exists

5. Save changes

6. Wait 1-24 hours for DNS propagation

---

## Part 4: Verify SSL Certificate

1. Vercel automatically provisions SSL certificates

2. After DNS propagates, visit:
   - https://goodhang.club
   - https://www.goodhang.club

3. Both should show your site with a valid SSL certificate 🔒

---

## Part 5: Automatic Deployments

From now on, every time you push to GitHub:

```bash
# Make changes to your code
git add .
git commit -m "Updated features"
git push
```

Vercel will automatically:
1. Detect the push
2. Build your site
3. Deploy the new version
4. Go live in ~2 minutes

---

## Troubleshooting

**Issue: "Domain is already in use"**
- Another Vercel project may be using this domain
- Remove it from the other project first

**Issue: SSL certificate not provisioning**
- Wait 24 hours for DNS to fully propagate
- Check DNS with: https://dnschecker.org

**Issue: Environment variables not working**
- Make sure you added them in Vercel dashboard
- Redeploy after adding variables

---

## Benefits of Vercel

✅ **Automatic deployments** from GitHub
✅ **Global CDN** - Fast worldwide
✅ **Automatic SSL** certificates
✅ **Preview deployments** for every branch
✅ **Zero configuration** - Just works
✅ **Free for hobby projects**
✅ **Built for Next.js** by the Next.js team

---

## Local Development Workflow

```bash
# Start local dev server
cd goodhang-web
npm run dev
# Visit http://localhost:3200

# Make changes, test locally

# When ready to deploy:
git add .
git commit -m "Your changes"
git push

# Vercel deploys automatically in ~2 minutes
```

That's it! Your site will be live at https://goodhang.club with automatic deployments. 🚀
