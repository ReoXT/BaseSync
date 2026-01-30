# 🚀 Stripe Setup - Quick Reference Card

## 📦 What You Need in .env.server

```bash
# 1. Stripe API Key
STRIPE_API_KEY=sk_test_...  # or sk_live_... for production

# 2. Webhook Secret
STRIPE_WEBHOOK_SECRET=whsec_...

# 3. Product Price IDs (MONTHLY prices only)
PAYMENTS_STARTER_SUBSCRIPTION_PLAN_ID=price_...
PAYMENTS_PRO_SUBSCRIPTION_PLAN_ID=price_...
PAYMENTS_BUSINESS_SUBSCRIPTION_PLAN_ID=price_...
```

---

## ⚡ Quick Setup Steps

### Step 1: Get API Key (2 minutes)
1. Go to [https://dashboard.stripe.com/test/apikeys](https://dashboard.stripe.com/test/apikeys)
2. Copy **Secret key** → Add to `STRIPE_API_KEY=`

### Step 2: Create Products (10 minutes)
1. Go to [https://dashboard.stripe.com/test/products](https://dashboard.stripe.com/test/products)
2. Create 3 products with 2 prices each:

| Product | Monthly | Annual (×12) |
|---------|---------|--------------|
| Starter | $9.99   | $95.88 ($7.99/mo) |
| Pro     | $19.99  | $191.88 ($15.99/mo) |
| Business| $39.99  | $383.88 ($31.99/mo) |

3. Copy **MONTHLY** price IDs → Add to `.env.server`

### Step 3: Setup Webhooks (5 minutes)

**For Development:**
```bash
# Install Stripe CLI
brew install stripe/stripe-cli/stripe

# Login
stripe login

# Start webhook forwarding
stripe listen --forward-to localhost:3001/payments-webhook
```

Copy the `whsec_...` secret → Add to `STRIPE_WEBHOOK_SECRET=`

**For Production:**
1. Go to [https://dashboard.stripe.com/webhooks](https://dashboard.stripe.com/webhooks)
2. Add endpoint: `https://yourdomain.com/payments-webhook`
3. Select events: `checkout.session.completed`, `customer.subscription.*`, `invoice.*`
4. Copy signing secret → Add to production `STRIPE_WEBHOOK_SECRET=`

### Step 4: Enable Customer Portal (3 minutes)
1. Go to [https://dashboard.stripe.com/test/settings/billing/portal](https://dashboard.stripe.com/test/settings/billing/portal)
2. Click **Activate**
3. Enable: Update payment method, Update subscription, Cancel subscription
4. Save

---

## 🧪 Testing with Test Cards

```
Success:              4242 4242 4242 4242
Requires auth:        4000 0025 0000 3155
Declined:             4000 0000 0000 9995

Expiry: Any future date (12/34)
CVC: Any 3 digits (123)
ZIP: Any 5 digits (12345)
```

---

## 🔍 Quick Troubleshooting

| Problem | Solution |
|---------|----------|
| Webhook not received | Make sure `stripe listen` is running |
| Payment fails | Check test card number and API key |
| Wrong price shown | Verify you used MONTHLY price IDs |
| Portal doesn't work | Enable Customer Portal in Stripe settings |

---

## 📋 Production Checklist

- [ ] Switch to Live mode in Stripe
- [ ] Create production products
- [ ] Update `.env.server` with live API key
- [ ] Update price IDs with live IDs
- [ ] Create production webhook endpoint
- [ ] Update webhook secret
- [ ] Enable Customer Portal in Live mode
- [ ] Test with real card

---

## 🔗 Important Links

- API Keys: [https://dashboard.stripe.com/apikeys](https://dashboard.stripe.com/apikeys)
- Products: [https://dashboard.stripe.com/products](https://dashboard.stripe.com/products)
- Webhooks: [https://dashboard.stripe.com/webhooks](https://dashboard.stripe.com/webhooks)
- Customer Portal: [https://dashboard.stripe.com/settings/billing/portal](https://dashboard.stripe.com/settings/billing/portal)
- Test Cards: [https://stripe.com/docs/testing](https://stripe.com/docs/testing)

---

**Full guide: See STRIPE_SETUP_GUIDE.md**
