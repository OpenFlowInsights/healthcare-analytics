# Password Protection Setup Guide

Your website now has password protection enabled. Follow these steps to complete the setup and deploy.

## What Was Added

1. **Middleware** (`middleware.ts`) - Intercepts all requests and checks for authentication
2. **Login Page** (`app/site-access/page.tsx`) - Beautiful login interface for password entry
3. **API Route** (`app/api/auth/verify-password/route.ts`) - Handles password verification
4. **Environment Variables** - Added to `.env.local` for local development

## Setup Steps

### 1. Add Environment Variables to Vercel

You need to add these environment variables to your Vercel project:

1. Go to: https://vercel.com/your-username/ofi-healthcare/settings/environment-variables

2. Add the following variables (for **Production** environment):

   ```
   SITE_ACCESS_PASSWORD=OFI2025Preview
   SITE_ACCESS_TOKEN=a8f5e2c9b4d7f1a3e6c8b5d9f2a4e7c1b3d6f9a2e5c8b1d4f7a0e3c6b9d2f5a8
   ```

   **Note:** You can change `OFI2025Preview` to any password you prefer.

### 2. Deploy to Vercel

Option A - Using Vercel CLI:
```bash
cd /home/ubuntu/projects/healthcare-analytics/app
vercel --prod
```

Option B - Using Git (if connected to GitHub):
```bash
git add .
git commit -m "Add password protection for preview mode"
git push origin main
```

Vercel will automatically deploy the changes.

### 3. Test the Password Protection

1. Visit: https://ofi-healthcare.vercel.app/
2. You should be redirected to the login page
3. Enter password: `OFI2025Preview` (or your custom password)
4. You'll be granted access for 30 days (via cookie)

## How It Works

- **All pages are protected** - Users must enter the password to access any page
- **Cookie-based authentication** - Once authenticated, users stay logged in for 30 days
- **Redirect after login** - Users are redirected to the page they originally tried to access
- **Static files exempt** - Images and other assets load normally

## When Ready to Launch

To remove password protection and launch publicly:

1. **Delete these files:**
   ```bash
   rm middleware.ts
   rm -rf app/site-access
   rm -rf app/api/auth/verify-password
   ```

2. **Remove from .env.local:**
   ```bash
   # Delete these lines:
   SITE_ACCESS_PASSWORD=...
   SITE_ACCESS_TOKEN=...
   ```

3. **Remove from Vercel:**
   - Go to Vercel > Settings > Environment Variables
   - Delete `SITE_ACCESS_PASSWORD` and `SITE_ACCESS_TOKEN`

4. **Deploy:**
   ```bash
   vercel --prod
   ```

## Customization

### Change the Password
Edit `.env.local` and update on Vercel:
```
SITE_ACCESS_PASSWORD=YourNewPassword
```

### Customize Login Page
Edit `app/site-access/page.tsx` to change:
- Colors and styling
- Logo and branding
- Instructions text

### Change Cookie Duration
Edit `app/api/auth/verify-password/route.ts`, line 33:
```typescript
maxAge: 30 * 24 * 60 * 60, // Change 30 to desired days
```

## Troubleshooting

### Issue: "Server configuration error"
- Make sure environment variables are set in Vercel
- Redeploy after adding variables

### Issue: Redirects in a loop
- Clear browser cookies
- Check that SITE_ACCESS_TOKEN is exactly the same in code and Vercel

### Issue: Can't access static files
- The middleware automatically exempts static files
- If issues persist, check the `middleware.ts` matcher config

## Security Notes

- This is a simple password protection suitable for preview/staging
- All users share the same password
- For production auth, consider NextAuth.js with proper user accounts
- The password is stored in plain text in env variables (acceptable for temporary use)
- HTTPS (provided by Vercel) encrypts the password in transit

## Current Password

**Password:** `OFI2025Preview`

Share this password only with people who should have access to the preview site.
