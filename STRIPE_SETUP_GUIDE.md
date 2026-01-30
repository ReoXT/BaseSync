# BaseSync Stripe Integration Guide

Complete guide to setting up Stripe payments for BaseSync in development and production.

---

## 📋 Overview

BaseSync uses Stripe for payment processing with three subscription tiers:
- **Starter**: $9.99/month (or $7.99/month billed annually)
- **Pro**: $19.99/month (or $15.99/month billed annually)
- **Business**: $39.99/month (or $31.99/month billed annually)

All plans include a **14-day free trial** with no credit card required.

---

## 🎯 Part 1: Stripe Account Setup

### 1.1 Create Your Stripe Account

1. Go to [https://stripe.com](https://stripe.com) and sign up
2. Complete account verification (provide business details)
3. Note: You can test in "Test Mode" before going live

### 1.2 Get Your API Keys

**For Development (Test Mode):**

1. Go to [https://dashboard.stripe.com/test/apikeys](https://dashboard.stripe.com/test/apikeys)
2. Copy your **Secret key** (starts with `sk_test_...`)
3. Add to `.env.server`:
   ```bash
   STRIPE_API_KEY=sk_test_your_key_here
   ```

**For Production:**

1. Toggle to "Live mode" in the Stripe dashboard (top right)
2. Go to [https://dashboard.stripe.com/apikeys](https://dashboard.stripe.com/apikeys)
3. Copy your **Live Secret key** (starts with `sk_live_...`)
4. Use this in production `.env.server`:
   ```bash
   STRIPE_API_KEY=sk_live_your_key_here
   ```

---

## 💰 Part 2: Create Products and Prices

### 2.1 Starter Plan

1. Go to **Products** → [https://dashboard.stripe.com/test/products](https://dashboard.stripe.com/test/products)
2. Click **"+ Add Product"**
3. Fill in:
   - **Name**: `BaseSync Starter`
   - **Description**: `For individuals - 1 sync configuration, 1,000 records per sync, 15-minute sync interval`
   - **Pricing Model**: Select "Standard pricing"

4. **Add Monthly Price:**
   - Click **"+ Add another price"**
   - **Price**: `$9.99`
   - **Billing period**: `Monthly`
   - **Currency**: `USD`
   - Click **"Add price"**

5. **Add Annual Price:**
   - Click **"+ Add another price"** again
   - **Price**: `$95.88` (this is $7.99 × 12 months)
   - **Billing period**: `Yearly`
   - **Currency**: `USD`
   - Click **"Add price"**

6. Click **"Save product"**

7. **Copy the MONTHLY Price ID:**
   - Click on the monthly price you just created
   - Copy the Price ID (starts with `price_...`)
   - Add to `.env.server`:
     ```bash
     PAYMENTS_STARTER_SUBSCRIPTION_PLAN_ID=price_your_monthly_id_here
     ```

### 2.2 Pro Plan

Repeat the same process:

1. **Product Name**: `BaseSync Pro`
2. **Description**: `For power users - 3 sync configurations, 5,000 records per sync, 5-minute sync interval`
3. **Monthly Price**: `$19.99`
4. **Annual Price**: `$191.88` ($15.99 × 12)
5. Copy the **MONTHLY** Price ID to `.env.server`:
   ```bash
   PAYMENTS_PRO_SUBSCRIPTION_PLAN_ID=price_your_pro_monthly_id_here
   ```

### 2.3 Business Plan

Repeat one more time:

1. **Product Name**: `BaseSync Business`
2. **Description**: `For growing teams - 10 sync configurations, unlimited records, 5-minute sync interval, priority support`
3. **Monthly Price**: `$39.99`
4. **Annual Price**: `$383.88` ($31.99 × 12)
5. Copy the **MONTHLY** Price ID to `.env.server`:
   ```bash
   PAYMENTS_BUSINESS_SUBSCRIPTION_PLAN_ID=price_your_business_monthly_id_here
   ```

### 2.4 Important Notes

- **Only use MONTHLY price IDs** in `.env.server` - the app handles switching to annual prices in the code
- Keep both monthly and annual prices active in Stripe
- You can add trial periods later in the Stripe dashboard if needed

---

## 🔔 Part 3: Webhook Setup

Webhooks allow Stripe to notify your app when events happen (payment succeeded, subscription cancelled, etc.).

### 3.1 Development Webhooks (Local Testing)

**Install Stripe CLI:**

```bash
# macOS
brew install stripe/stripe-cli/stripe

# Windows (with Scoop)
scoop bucket add stripe https://github.com/stripe/scoop-stripe-cli.git
scoop install stripe

# Or download from: https://github.com/stripe/stripe-cli/releases
```

**Login to Stripe CLI:**

```bash
stripe login
```

This will open your browser to authenticate.

**Start Webhook Forwarding:**

In a separate terminal, run:

```bash
stripe listen --forward-to localhost:3001/payments-webhook
```

This command will output a webhook signing secret that looks like:
```
> Ready! Your webhook signing secret is whsec_abc123...
```

**Add Webhook Secret to `.env.server`:**

```bash
STRIPE_WEBHOOK_SECRET=whsec_abc123...
```

**Keep the Stripe CLI running** while developing locally. Restart it whenever you restart your dev server.

### 3.2 Production Webhooks

**Create Webhook Endpoint:**

1. Go to [https://dashboard.stripe.com/webhooks](https://dashboard.stripe.com/webhooks)
2. Click **"+ Add endpoint"**
3. Enter your endpoint URL:
   ```
   https://yourdomain.com/payments-webhook
   ```
   Replace `yourdomain.com` with your actual production domain.

4. Click **"Select events"** and choose these events:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.paid`
   - `invoice.payment_failed`

5. Click **"Add endpoint"**

**Copy Webhook Signing Secret:**

1. Click on the webhook endpoint you just created
2. Click **"Reveal"** next to "Signing secret"
3. Copy the signing secret (starts with `whsec_...`)
4. Add to your **production** `.env.server`:
   ```bash
   STRIPE_WEBHOOK_SECRET=whsec_your_production_secret_here
   ```

---

## 🎁 Part 4: Configure Free Trials

### 4.1 Add Trial Period to Products

For each product (Starter, Pro, Business):

1. Go to **Products** in Stripe dashboard
2. Click on the product
3. Click **"Add trial"** or edit existing pricing
4. Set **Trial period**: `14 days`
5. Check **"Trial doesn't require payment method"** (no credit card upfront)
6. Save changes

Alternatively, you can configure trials programmatically (already done in OpenSaaS code).

---

## 🔐 Part 5: Customer Portal Setup

The Customer Portal lets users manage their subscriptions (upgrade, downgrade, cancel).

### 5.1 Enable Customer Portal

1. Go to [https://dashboard.stripe.com/test/settings/billing/portal](https://dashboard.stripe.com/test/settings/billing/portal)
2. Click **"Activate"**
3. Configure settings:
   - **Business information**: Add your company name, logo, etc.
   - **Functionality**:
     - ✅ Customer can update payment method
     - ✅ Customer can update subscription (switch plans)
     - ✅ Customer can cancel subscription
   - **Cancellation**:
     - Set cancellation behavior: "Cancel immediately" or "Cancel at period end" (recommended)
   - **Invoices**: ✅ Let customers view invoice history

4. Click **"Save"**

### 5.2 Production Customer Portal

Repeat the same steps in **Live mode**:
[https://dashboard.stripe.com/settings/billing/portal](https://dashboard.stripe.com/settings/billing/portal)

---

## 🚀 Part 6: Testing Your Setup

### 6.1 Test Locally

1. **Start your app:**
   ```bash
   wasp start
   ```

2. **Start Stripe webhook forwarding** (in separate terminal):
   ```bash
   stripe listen --forward-to localhost:3001/payments-webhook
   ```

3. **Create a test account** in your app and navigate to pricing page

4. **Use Stripe test card numbers:**
   - **Success**: `4242 4242 4242 4242`
   - **Requires authentication**: `4000 0025 0000 3155`
   - **Declined**: `4000 0000 0000 9995`
   - **Expiry**: Any future date (e.g., `12/34`)
   - **CVC**: Any 3 digits (e.g., `123`)
   - **ZIP**: Any 5 digits (e.g., `12345`)

5. **Complete a test purchase** and verify:
   - Checkout session completes successfully
   - User is redirected back to your app
   - Subscription shows up in Stripe dashboard
   - Webhook events are received (check Stripe CLI output)

### 6.2 Verify Webhook Events

In the terminal running `stripe listen`, you should see events like:

```
✔  Received event: checkout.session.completed
✔  Received event: customer.subscription.created
✔  Received event: invoice.paid
```

If you don't see events, check:
- Stripe CLI is running
- Webhook URL is correct in CLI command
- App is running and accessible at `localhost:3001`

---

## 📊 Part 7: Going Live

### 7.1 Pre-Launch Checklist

- [ ] Switch Stripe dashboard to **Live mode**
- [ ] Create production products and prices (repeat Part 2 in Live mode)
- [ ] Update `.env.server` with live API keys:
  - `STRIPE_API_KEY=sk_live_...`
  - `PAYMENTS_STARTER_SUBSCRIPTION_PLAN_ID=price_live_...`
  - `PAYMENTS_PRO_SUBSCRIPTION_PLAN_ID=price_live_...`
  - `PAYMENTS_BUSINESS_SUBSCRIPTION_PLAN_ID=price_live_...`
- [ ] Set up production webhook endpoint (Part 3.2)
- [ ] Update `STRIPE_WEBHOOK_SECRET` with production secret
- [ ] Enable Customer Portal in Live mode (Part 5.2)
- [ ] Verify business information in Stripe settings
- [ ] Test a real purchase with a real credit card
- [ ] Enable Stripe Radar for fraud protection (recommended)

### 7.2 Deployment

When deploying to production:

1. **Set environment variables** in your hosting platform (Fly.io, Railway, Vercel, etc.)
2. Make sure all Stripe env variables are set:
   ```bash
   STRIPE_API_KEY=sk_live_...
   STRIPE_WEBHOOK_SECRET=whsec_...
   PAYMENTS_STARTER_SUBSCRIPTION_PLAN_ID=price_...
   PAYMENTS_PRO_SUBSCRIPTION_PLAN_ID=price_...
   PAYMENTS_BUSINESS_SUBSCRIPTION_PLAN_ID=price_...
   ```

3. **Verify webhook endpoint** is accessible:
   ```
   https://yourdomain.com/payments-webhook
   ```

4. **Monitor webhooks** in Stripe dashboard under "Developers → Webhooks"
   - Check for failed deliveries
   - Stripe will retry failed webhooks automatically

---

## 🧪 Part 8: Common Testing Scenarios

### Test Card Numbers for Specific Scenarios

```
Successful payment:           4242 4242 4242 4242
Requires authentication:      4000 0025 0000 3155
Payment declined:             4000 0000 0000 9995
Insufficient funds:           4000 0000 0000 9995
Expired card:                 4000 0000 0000 0069
Incorrect CVC:                4000 0000 0000 0127
```

### Test Subscription Lifecycle

1. **Sign up with trial:**
   - Create account
   - Select a plan
   - Complete checkout with test card
   - Verify trial period is active (14 days)

2. **Upgrade/Downgrade:**
   - Go to Account Settings
   - Click "Manage Subscription"
   - Switch to different plan
   - Verify proration is applied correctly

3. **Cancel subscription:**
   - Go to Customer Portal
   - Click "Cancel subscription"
   - Verify cancellation appears in Stripe

4. **Subscription renewal:**
   - Use Stripe dashboard to manually end trial period
   - Verify payment is charged
   - Check webhook events are received

---

## 🔍 Part 9: Monitoring and Debugging

### 9.1 Stripe Dashboard

Monitor your business in real-time:
- **Payments**: [https://dashboard.stripe.com/payments](https://dashboard.stripe.com/payments)
- **Subscriptions**: [https://dashboard.stripe.com/subscriptions](https://dashboard.stripe.com/subscriptions)
- **Customers**: [https://dashboard.stripe.com/customers](https://dashboard.stripe.com/customers)

### 9.2 View Webhook Logs

Check if webhooks are being delivered:
1. Go to **Developers → Webhooks**
2. Click on your webhook endpoint
3. View **Recent deliveries**
4. Click on individual events to see request/response details

### 9.3 Common Issues

**Webhook not received:**
- Check webhook URL is correct
- Verify app is running and accessible
- Check firewall/security settings
- Review webhook signature verification in code

**Payment fails:**
- Check card details are correct (use test cards)
- Verify Stripe API key is valid
- Check product/price IDs exist in Stripe
- Review error in Stripe dashboard

**Subscription not created:**
- Verify webhook events are being received
- Check database for user subscription status
- Review server logs for errors
- Use Stripe CLI to debug locally

---

## 📝 Part 10: Environment Variables Summary

Here's a complete list of all Stripe-related environment variables needed:

### Development (.env.server)

```bash
# Stripe API Key (Test Mode)
STRIPE_API_KEY=sk_test_your_test_key_here

# Webhook Secret (from Stripe CLI: stripe listen --forward-to localhost:3001/payments-webhook)
STRIPE_WEBHOOK_SECRET=whsec_your_test_webhook_secret_here

# Product Price IDs (Test Mode - MONTHLY prices only)
PAYMENTS_STARTER_SUBSCRIPTION_PLAN_ID=price_test_starter_monthly_id
PAYMENTS_PRO_SUBSCRIPTION_PLAN_ID=price_test_pro_monthly_id
PAYMENTS_BUSINESS_SUBSCRIPTION_PLAN_ID=price_test_business_monthly_id
```

### Production (.env.server on hosting platform)

```bash
# Stripe API Key (Live Mode)
STRIPE_API_KEY=sk_live_your_live_key_here

# Webhook Secret (from Stripe Dashboard → Webhooks)
STRIPE_WEBHOOK_SECRET=whsec_your_production_webhook_secret_here

# Product Price IDs (Live Mode - MONTHLY prices only)
PAYMENTS_STARTER_SUBSCRIPTION_PLAN_ID=price_live_starter_monthly_id
PAYMENTS_PRO_SUBSCRIPTION_PLAN_ID=price_live_pro_monthly_id
PAYMENTS_BUSINESS_SUBSCRIPTION_PLAN_ID=price_live_business_monthly_id
```

---

## 🎉 You're Done!

Your BaseSync app is now fully integrated with Stripe. Users can:
- ✅ Start a 14-day free trial (no credit card required)
- ✅ Subscribe to Starter, Pro, or Business plans
- ✅ Choose monthly or annual billing (with 20% discount)
- ✅ Manage their subscription via Stripe Customer Portal
- ✅ Upgrade, downgrade, or cancel anytime

### Next Steps

1. **Test thoroughly** with Stripe test cards
2. **Monitor webhooks** to ensure they're being received
3. **Create production products** when ready to launch
4. **Enable fraud detection** in Stripe Radar (Live mode)
5. **Set up email notifications** for payment failures (optional)

### Resources

- [Stripe Dashboard](https://dashboard.stripe.com)
- [Stripe CLI Docs](https://stripe.com/docs/stripe-cli)
- [Stripe Testing Guide](https://stripe.com/docs/testing)
- [Webhooks Reference](https://stripe.com/docs/webhooks)
- [OpenSaaS Docs](https://docs.opensaas.sh)

---

**Need Help?**
- Stripe Support: [https://support.stripe.com](https://support.stripe.com)
- BaseSync Issues: Check your project's GitHub issues
- OpenSaaS Community: [Discord](https://discord.gg/rzdnErX)
