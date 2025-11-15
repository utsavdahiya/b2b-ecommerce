# 🚀 Deployment Guide - Render.com

This guide will help you deploy your B2B E-Commerce platform to Render in under 10 minutes.

## Prerequisites

- GitHub account with your code pushed
- Render.com account (free)

## Step 1: Create PostgreSQL Database

1. Go to [Render Dashboard](https://dashboard.render.com/)
2. Click "New +" → "PostgreSQL"
3. Configure:
   - **Name**: `b2b-ecommerce-db`
   - **Database**: `b2b_ecommerce`
   - **User**: (auto-generated)
   - **Region**: Choose closest to your users
   - **Plan**: Free
4. Click "Create Database"
5. Wait for database to be created (2-3 minutes)
6. **IMPORTANT**: Copy the "Internal Database URL" - you'll need this!

## Step 2: Create Web Service

1. In Render Dashboard, click "New +" → "Web Service"
2. Connect your GitHub repository
3. Configure:
   - **Name**: `b2b-ecommerce` (or your preferred name)
   - **Region**: Same as database
   - **Branch**: `main`
   - **Runtime**: Node
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
   - **Plan**: Free

## Step 3: Configure Environment Variables

In the Web Service settings, add these environment variables:

```
DATABASE_URL       = <paste-internal-database-url-from-step-1>
JWT_SECRET        = <generate-secure-random-string>
JWT_EXPIRES_IN    = 7d
NEXT_PUBLIC_APP_URL = https://your-app-name.onrender.com
NODE_ENV          = production
```

To generate a secure JWT_SECRET:
```bash
openssl rand -base64 32
```

Or use any secure random string generator.

## Step 4: Deploy

1. Click "Create Web Service"
2. Render will automatically:
   - Install dependencies
   - Build your Next.js app
   - Start the server
3. Wait for deployment (5-10 minutes for first deploy)

## Step 5: Initialize Database

After your app is deployed:

1. In Render Dashboard, go to your Web Service
2. Click "Shell" in the left sidebar
3. Run the initialization script:

```bash
./scripts/init-render.sh
```

Or manually:

```bash
node lib/db/init.js
```

This will:
- Create all database tables
- Set up indexes and triggers
- Seed sample products

## Step 6: Test Your Application

1. Visit your app URL: `https://your-app-name.onrender.com`
2. Click "Sign Up" to create a B2B account
3. Fill in company details
4. Browse products and test the configurator!

## 🎉 You're Live!

Your B2B printing platform is now deployed and running on Render!

## 📊 Monitor Your Application

- **Logs**: Web Service → Logs tab
- **Metrics**: Web Service → Metrics tab
- **Database**: PostgreSQL → Info tab

## 🔧 Troubleshooting

### App won't start
- Check Environment Variables are set correctly
- Verify DATABASE_URL is the "Internal" URL, not "External"
- Check logs for error messages

### Database connection errors
- Ensure database is in the same region as web service
- Verify DATABASE_URL is correct
- Check database is running (green status)

### Build fails
- Check Node.js version compatibility
- Verify all dependencies in package.json
- Check build logs for specific errors

## 🚀 Updates and Re-deployment

Render automatically deploys when you push to your main branch:

```bash
git add .
git commit -m "Update feature"
git push origin main
```

Render will automatically:
1. Detect the push
2. Build your changes
3. Deploy the new version
4. Zero-downtime deployment!

## 💰 Scaling (When Ready)

Free tier limitations:
- Apps spin down after 15 minutes of inactivity
- First request after spin-down takes 30-60 seconds
- 750 hours/month free

To upgrade:
1. Go to Web Service settings
2. Change plan to "Starter" ($7/month)
3. Benefits:
   - Always on (no spin down)
   - Instant response times
   - More memory and CPU

## 🔐 Security Best Practices

1. **Never commit .env.local** - It's gitignored by default
2. **Use strong JWT_SECRET** - Generate with `openssl rand -base64 32`
3. **Enable HTTPS** - Render provides this automatically
4. **Regular updates** - Keep dependencies updated
5. **Monitor logs** - Check for unusual activity

## 📞 Support

- **Render Docs**: https://render.com/docs
- **Render Support**: support@render.com
- **App Issues**: Check logs in Render dashboard

---

**Estimated Total Time**: 10-15 minutes
**Estimated Cost**: $0 (Free tier) or $7/month (Starter)

Happy deploying! 🎉

