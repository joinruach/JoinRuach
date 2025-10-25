# Email Confirmation Troubleshooting Guide

## Issues Fixed

### 1. ✅ **Missing Confirmation Handler**
**Problem:** The `/confirmed` page didn't actually confirm accounts with Strapi.

**Fix:** Updated `/apps/ruach-next/src/app/confirmed/page.tsx` to:
- Call Strapi's `/api/auth/email-confirmation` endpoint
- Show success/error messages
- Redirect to login after successful confirmation

### 2. ✅ **Added Email Logging**
**Problem:** No visibility into whether emails were being sent.

**Fix:** Created `/ruach-ministries-backend/src/extensions/users-permissions/strapi-server.js` to:
- Log all email confirmation attempts
- Show detailed error messages
- Track email delivery status

### 3. ✅ **Email Testing Script**
**Problem:** No way to verify email configuration.

**Fix:** Created `/ruach-ministries-backend/scripts/test-email.js` to test Resend setup.

---

## Common Issues & Solutions

### Issue 1: "I never receive the confirmation email"

#### Possible Causes:

**A. RESEND_API_KEY not configured**

Check your backend `.env` file:
```bash
cd ruach-ministries-backend
cat .env | grep RESEND_API_KEY
```

If missing or set to `re_xxxxxxxxxxxxxxxxxxxxx`:
1. Go to https://resend.com/api-keys
2. Create a new API key
3. Add to `.env`:
   ```
   RESEND_API_KEY=re_your_actual_key_here
   ```
4. Restart Strapi: `pnpm dev`

**B. Email domain not verified in Resend**

Resend requires domain verification for production use.

Test with the test email script:
```bash
cd ruach-ministries-backend
node scripts/test-email.js your@email.com
```

If it fails with "Domain not verified":
1. Go to https://resend.com/domains
2. Add `updates.joinruach.org`
3. Add the DNS records to your domain provider
4. Wait for verification (5-30 minutes)

**C. Emails going to spam**

Check your spam folder! New domains often get filtered initially.

To improve deliverability:
- Add SPF, DKIM, and DMARC records (Resend provides these)
- Warm up your domain by sending a few test emails first
- Use a consistent "From" address

#### Test Email Sending:

```bash
cd ruach-ministries-backend
node scripts/test-email.js your@email.com
```

Expected output:
```
✅ Email sent successfully!
   Email ID: abc123...
```

---

### Issue 2: "401 Unauthorized when trying to login"

This is **expected behavior** if your email is not confirmed!

#### Solution:

**Option A: Use the Resend Button**
1. Go to the "Check your email" page
2. Click "Resend" to get a new confirmation email
3. Check your inbox (and spam folder)
4. Click the confirmation link
5. Try logging in again

**Option B: Manually Confirm via Strapi Admin (Emergency Only)**

Only use this if emails are completely broken:

1. Go to http://localhost:1337/admin
2. Login to Strapi admin
3. Navigate to: Content Manager → User (users-permissions)
4. Find your user
5. Check the "Confirmed" checkbox
6. Click Save
7. Now try logging in

**Important:** After manually confirming, you still need to fix the email issue for future users!

---

### Issue 3: "Error after manually confirming via admin"

This might happen if:
1. The user was already confirmed
2. The confirmation token is missing
3. There's a database issue

#### Check the backend logs:

```bash
cd ruach-ministries-backend
# Look for errors in the console output
```

Look for errors related to:
- `confirmationToken`
- `email_confirmation`
- Database constraints

#### Fix:

Usually this resolves itself once you try logging in again. If not:
1. Clear your browser cookies
2. Try signing in with the credentials
3. If it still fails, delete the user in Strapi admin and sign up again

---

## Verification Checklist

Run through this checklist to ensure everything is configured:

### Backend Configuration

- [ ] `RESEND_API_KEY` is set in `/ruach-ministries-backend/.env`
- [ ] Email provider configured in `/ruach-ministries-backend/config/plugins.js`
- [ ] Bootstrap file exists: `/ruach-ministries-backend/config/bootstrap.js`
- [ ] Test email sends successfully: `node scripts/test-email.js your@email.com`

### Frontend Configuration

- [ ] `NEXT_PUBLIC_STRAPI_URL` is set in `/apps/ruach-next/.env.local`
- [ ] `/confirmed` page exists and works
- [ ] `/check-email` page shows resend button

### Strapi Settings (in Admin Panel)

1. Go to: Settings → Users & Permissions Plugin → Email Templates
2. Verify "Email address confirmation" template exists
3. Check the message contains `<%= CODE %>`

4. Go to: Settings → Users & Permissions Plugin → Advanced Settings
5. Verify these settings:
   - ✅ Enable email confirmation
   - ✅ Redirection url: `https://joinruach.org/confirmed` (or your domain)

---

## Testing the Full Flow

### Step-by-Step Test:

1. **Start the backend:**
   ```bash
   cd ruach-ministries-backend
   pnpm dev
   ```

2. **Start the frontend:**
   ```bash
   cd apps/ruach-next
   pnpm dev
   ```

3. **Sign up:**
   - Go to http://localhost:3000/signup
   - Enter email and password
   - Click "Sign Up"

4. **Check for confirmation email:**
   - You should see "Check your email" page
   - Check your inbox (and spam!)
   - Look for email from `no-reply@updates.joinruach.org`

5. **Check backend logs:**
   ```
   Should see:
   → Sending confirmation email
   → Email sent successfully
   ```

   If you see errors, note them and fix the specific issue.

6. **Click confirmation link:**
   - Click the link in the email
   - Should redirect to `/confirmed?confirmation=xxx`
   - Should show "✓ Email Confirmed!"

7. **Try logging in:**
   - Go to http://localhost:3000/login
   - Enter your credentials
   - Should successfully log in!

---

## Quick Fixes

### "I need to test right now and emails are broken"

Temporarily disable email confirmation:

1. Edit `/ruach-ministries-backend/config/bootstrap.js`
2. Change line 57:
   ```javascript
   // Before:
   advancedSettings.email_confirmation = true;

   // After (TEMPORARY - FOR TESTING ONLY):
   advancedSettings.email_confirmation = false;
   ```
3. Restart Strapi
4. Sign up - no confirmation needed!

**⚠️ WARNING:** Don't use this in production! Re-enable email confirmation before deploying.

---

## Environment Variables Reference

### Backend (.env)

```bash
# Required for emails
RESEND_API_KEY=re_your_actual_key_here

# Optional (has defaults)
EMAIL_DEFAULT_FROM=no-reply@updates.joinruach.org
EMAIL_DEFAULT_FROM_NAME=Ruach
EMAIL_DEFAULT_REPLY_TO=support@updates.joinruach.org
STRAPI_EMAIL_CONFIRM_REDIRECT=https://joinruach.org/confirmed
```

### Frontend (.env.local)

```bash
NEXT_PUBLIC_STRAPI_URL=http://localhost:1337
NEXTAUTH_URL=http://localhost:3000
```

---

## Still Having Issues?

### Enable Debug Logging

1. Check backend console output when someone signs up
2. Look for:
   ```
   [Winston] Auth: Registration
   [Winston] Email: Sending confirmation
   [Winston] Email: Sent successfully
   ```

3. If you see errors, they'll show the specific problem

### Common Error Messages:

| Error | Cause | Fix |
|-------|-------|-----|
| "RESEND_API_KEY is not configured" | Missing API key | Add to `.env` |
| "Domain not verified" | Domain not verified in Resend | Verify domain |
| "Invalid token" | Confirmation link expired/used | Resend email |
| "User already confirmed" | Already confirmed | Try logging in |
| "Email service error" | Resend API issue | Check API status |

---

## Need Help?

If you're still stuck:

1. Run the email test script and share the output:
   ```bash
   node scripts/test-email.js your@email.com
   ```

2. Check Strapi logs for errors:
   ```bash
   cd ruach-ministries-backend
   pnpm dev
   # Copy any errors from console
   ```

3. Check Resend dashboard:
   - Go to https://resend.com/emails
   - Look for recent sends
   - Check delivery status

4. Verify your `.env` files have all required variables (see reference above)
