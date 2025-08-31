# Payment Integration Setup Guide

This application now includes real Stripe payment processing for Pro plan upgrades. Here's how the payment system works and how to set it up.

## How It Works

### 🔄 Payment Flow
1. **User clicks upgrade** → Payment modal opens
2. **User enters card details** → Stripe Elements handles secure input
3. **Frontend creates PaymentIntent** → Backend calls Stripe API
4. **User confirms payment** → Stripe processes the transaction
5. **Webhook receives event** → Backend upgrades user membership
6. **Success feedback** → User sees confirmation and updated UI

### 💳 Payment Processing
- **Real payments** through Stripe (not simulated anymore!)
- **Secure card handling** with Stripe Elements (PCI compliant)
- **Webhook-based** membership upgrades for reliability
- **Error handling** for declined cards and network issues

## Setup Instructions

### 1. Create Stripe Account
1. Go to [https://stripe.com](https://stripe.com) and create an account
2. Complete the account setup and verification
3. Get your API keys from the Stripe Dashboard

### 2. Get Your API Keys
From your Stripe Dashboard:
- **Publishable Key**: `pk_test_...` (for frontend)
- **Secret Key**: `sk_test_...` (for backend)

### 3. Create Environment Files

**Backend `.env` file:**
```env
STRIPE_SECRET_KEY=sk_test_your_actual_secret_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here
```

**Frontend `.env` file:**
```env
VUE_APP_STRIPE_PUBLISHABLE_KEY=pk_test_your_actual_publishable_key_here
```

### 4. Set Up Webhook Endpoint
1. In Stripe Dashboard, go to **Developers** → **Webhooks**
2. Click **Add endpoint**
3. Set URL to: `https://your-domain.com/api/payment/webhook`
4. Select these events:
   - `payment_intent.succeeded`
   - `invoice.payment_succeeded`
   - `customer.subscription.deleted`
   - `invoice.payment_failed`
5. Copy the **Webhook signing secret** to your backend `.env`

### 5. Install Dependencies
```bash
# Backend
cd backend
npm install stripe

# Frontend (Stripe.js is loaded dynamically, no install needed)
```

## API Endpoints

### Payment Routes (`/api/payment/`)

- **POST** `/create-payment-intent`
  - Creates a PaymentIntent for one-time €7.99 upgrade
  - Requires authentication
  - Returns `clientSecret` for frontend confirmation

- **POST** `/webhook`
  - Handles Stripe webhook events
  - Automatically upgrades user membership on successful payment
  - Raw body parsing for signature verification

- **GET** `/payment-status/:paymentIntentId`
  - Check status of a specific payment
  - Requires authentication

## Security Features

✅ **PCI Compliant**: Stripe Elements handles sensitive card data  
✅ **Webhook Verification**: Signatures prevent unauthorized requests  
✅ **Secure API Keys**: Server-side secret keys never exposed  
✅ **Authentication**: All endpoints require valid user tokens  
✅ **Error Handling**: Graceful failure with user feedback  

## Testing

### Test Card Numbers
Use these test cards in development:

| Card Number | Description |
|-------------|-------------|
| `4242 4242 4242 4242` | Visa - Always succeeds |
| `4000 0000 0000 0002` | Visa - Always declined |
| `4000 0000 0000 9995` | Visa - Always fails |

**Test Details:**
- **Expiry**: Any future date (e.g., `12/25`)
- **CVC**: Any 3 digits (e.g., `123`)
- **Name**: Any name

### Webhook Testing
Use [Stripe CLI](https://stripe.com/docs/stripe-cli) to test webhooks locally:

```bash
# Install Stripe CLI
npm install -g @stripe/stripe-cli

# Login to your Stripe account
stripe login

# Forward webhooks to local server
stripe listen --forward-to localhost:3001/api/payment/webhook
```

## Production Deployment

### 1. Use Live Keys
Replace test keys (`pk_test_`, `sk_test_`) with live keys (`pk_live_`, `sk_live_`)

### 2. Update Webhook URL
Point webhook to your production domain: `https://yourdomain.com/api/payment/webhook`

### 3. SSL Certificate
Ensure your domain has a valid SSL certificate (Stripe requires HTTPS)

### 4. Environment Variables
Set environment variables on your hosting platform (Vercel, Heroku, etc.)

## Troubleshooting

### Common Issues

**"Payment failed" errors:**
- Check your Stripe keys are correct
- Verify webhook endpoint is accessible
- Check server logs for detailed errors

**Webhook not working:**
- Verify webhook URL is correct
- Check webhook secret matches your env variable
- Ensure webhook events are properly configured

**Frontend errors:**
- Verify publishable key is set correctly
- Check browser console for Stripe.js loading errors
- Ensure you're using HTTPS in production

### Debug Mode
Set up logging to track payment flow:

```javascript
// In backend payment routes
console.log('Payment intent created:', paymentIntent.id)
console.log('Webhook event received:', event.type)
```

## Support

For Stripe-specific issues, check:
- [Stripe Documentation](https://stripe.com/docs)
- [Stripe Status Page](https://status.stripe.com)
- Your Stripe Dashboard logs

For integration issues:
- Check server logs
- Test with curl/Postman
- Verify environment variables are loaded correctly

---

🎉 **Your users can now make real payments and get automatically upgraded to Pro!**