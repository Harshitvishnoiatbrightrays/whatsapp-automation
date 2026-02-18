# Deploy to Vercel - Step by Step Guide

## Method 1: Deploy via Vercel Dashboard (Recommended)

### Step 1: Push to GitHub
Make sure your code is pushed to GitHub:
```bash
git push origin main
```

### Step 2: Connect to Vercel

1. Go to https://vercel.com
2. Sign up/Login with your GitHub account
3. Click **"Add New Project"**
4. Import your repository: `Harshitvishnoiatbrightrays/whatsapp-automation`

### Step 3: Configure Project

Vercel will auto-detect:
- **Framework Preset:** Vite
- **Build Command:** `npm run build`
- **Output Directory:** `dist`
- **Install Command:** `npm install`

You can leave these as default.

### Step 4: Add Environment Variables

**IMPORTANT:** Add these environment variables in Vercel dashboard:

1. Click **"Environment Variables"** section
2. Add each variable:

   ```
   VITE_SUPABASE_URL
   ```
   Value: Your Supabase project URL
   (e.g., `https://xxxxx.supabase.co`)

   ```
   VITE_SUPABASE_ANON_KEY
   ```
   Value: Your Supabase anon/public key

   ```
   VITE_EMAIL_DOMAIN
   ```
   Value: Your email domain (optional, e.g., `example.com`)

   ```
   VITE_N8N_WEBHOOK_URL
   ```
   Value: Your n8n webhook URL

3. Make sure to add them for **Production**, **Preview**, and **Development** environments

### Step 5: Deploy

1. Click **"Deploy"**
2. Wait for the build to complete
3. Your app will be live at `https://your-project.vercel.app`

## Method 2: Deploy via Vercel CLI

### Install Vercel CLI
```bash
npm i -g vercel
```

### Login
```bash
vercel login
```

### Deploy
```bash
# First deployment (will prompt for configuration)
vercel

# Production deployment
vercel --prod
```

### Set Environment Variables via CLI
```bash
vercel env add VITE_SUPABASE_URL
vercel env add VITE_SUPABASE_ANON_KEY
vercel env add VITE_EMAIL_DOMAIN
vercel env add VITE_N8N_WEBHOOK_URL
```

## After Deployment

1. **Test your deployment:**
   - Visit your Vercel URL
   - Test login functionality
   - Verify Supabase connection

2. **Update n8n webhook:**
   - Make sure your n8n webhook URL is accessible from the internet
   - Update it in Vercel environment variables if needed

3. **Custom Domain (Optional):**
   - Go to Project Settings → Domains
   - Add your custom domain

## Troubleshooting

- **Build fails:** Check that all environment variables are set
- **404 on routes:** Vercel.json is configured to handle React Router
- **Supabase errors:** Verify your Supabase URL and keys are correct
- **Webhook not working:** Check that VITE_N8N_WEBHOOK_URL is set correctly

## Important Notes

- Environment variables must start with `VITE_` to be accessible in the browser
- Never commit `.env` files to git (already in .gitignore)
- Vercel automatically rebuilds on every push to main branch
- Preview deployments are created for every pull request
