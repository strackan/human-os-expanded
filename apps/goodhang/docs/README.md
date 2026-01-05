# Good Hang Documentation

Welcome to the Good Hang development documentation! This folder contains all the guides and references you need to set up, develop, and deploy the Good Hang platform.

## 📚 Documentation Index

### Getting Started
- **[progress-summary.md](./progress-summary.md)** - Current development status, completed features, and what's next
- **[database-setup.md](./database-setup.md)** - SQL migrations and database schema reference

### Setup Guides
- **[typeform-setup.md](./typeform-setup.md)** - Step-by-step guide to create and configure the membership application form
- **[resend-setup.md](./resend-setup.md)** - Configure transactional emails for RSVP confirmations and membership approvals
- **[vercel-deployment.md](./vercel-deployment.md)** - Deploy to Vercel with custom domain configuration

### Features & Workflows
- **[approval-workflow.md](./approval-workflow.md)** - Complete guide to the membership approval and evaluation process

### Reference
- **[api-reference.md](./api-reference.md)** - API endpoints and webhook documentation
- **[testing-guide.md](./testing-guide.md)** - How to test each feature before launch

---

## 🚀 Quick Start

### 1. Local Development

```bash
# Install dependencies
cd goodhang-web
npm install

# Start dev server
npm run dev

# Visit http://localhost:3200
```

### 2. Environment Setup

Create `.env.local` with:
```
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
NEXT_PUBLIC_SITE_URL=http://localhost:3200
RESEND_API_KEY=re_your_resend_api_key
```

### 3. Database Setup

1. Go to Supabase SQL Editor
2. Run migrations from `supabase/migrations/` in order:
   - `001_initial_schema.sql`
   - `002_launch_event.sql` (update with your event details)
   - `003_seed_founding_members.sql`

### 4. Test the Site

- Visit `/login` and create your account
- Visit `/launch` to test RSVP flow
- Visit `/members/directory` to see the member directory
- Visit `/apply` to test membership application

---

## 📋 Pre-Launch Checklist

Before the happy hour, complete these tasks:

- [ ] Create Typeform (follow [typeform-setup.md](./typeform-setup.md))
- [ ] Run database migrations with actual event details
- [ ] Sign up and make yourself admin
- [ ] Add 5-10 founding member profiles
- [ ] Test all flows end-to-end
- [ ] Deploy to Vercel (follow [vercel-deployment.md](./vercel-deployment.md))
- [ ] Configure custom domain DNS

---

## 🏗️ Architecture Overview

```
goodhang-web/
├── app/                    # Next.js App Router pages
│   ├── launch/             # Launch party RSVP
│   ├── apply/              # Membership application
│   ├── login/              # Authentication
│   ├── members/            # Member area
│   └── api/                # API routes & webhooks
├── components/             # React components
├── lib/                    # Utilities & helpers
│   ├── supabase/           # Database client
│   └── types/              # TypeScript types
├── supabase/               # Database migrations
└── docs/                   # This documentation
```

---

## 🔧 Tech Stack

- **Frontend**: Next.js 16, React 19, TypeScript, Tailwind CSS
- **Backend**: Supabase (PostgreSQL, Auth, Storage)
- **Hosting**: Vercel
- **Forms**: Typeform
- **Email**: Resend (coming soon)

---

## 📞 Need Help?

- Check [progress-summary.md](./progress-summary.md) for current status
- Review specific setup guides for detailed instructions
- Test locally before deploying to production

---

## 🎯 Launch Goals

The MVP includes:
1. ✅ Launch event RSVP system
2. ✅ Public member directory
3. ✅ Membership application flow
4. ✅ Basic authentication
5. 🚧 Admin dashboard (in progress)
6. 🚧 Email notifications (coming soon)

Good luck with the launch! 🚀
