import express from 'express'
import StripeService from '../services/StripeService.js'
import { authenticateToken } from '../middleware/auth.js'

const router = express.Router()

// Create payment intent for one-time upgrade
router.post('/create-payment-intent', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId || req.user.id
    const { amount, plan = 'pro' } = req.body
    
    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Valid amount is required'
      })
    }

    const paymentIntent = await StripeService.createPaymentIntent(
      amount,
      'eur',
      {
        userId: userId.toString(),
        plan,
        type: 'one-time-upgrade'
      }
    )

    res.json({
      success: true,
      data: {
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id
      }
    })
  } catch (error) {
    console.error('Error creating payment intent:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to create payment intent'
    })
  }
})

// Create subscription for recurring billing
router.post('/create-subscription', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId || req.user.id
    const { email, name, priceId } = req.body
    
    if (!email || !priceId) {
      return res.status(400).json({
        success: false,
        message: 'Email and price ID are required'
      })
    }

    // Create customer first
    const customer = await StripeService.createCustomer(
      email,
      name || 'User',
      { userId: userId.toString() }
    )

    // Create subscription
    const subscription = await StripeService.createSubscription(
      customer.id,
      priceId,
      { userId: userId.toString(), plan: 'pro' }
    )

    res.json({
      success: true,
      data: {
        subscriptionId: subscription.id,
        clientSecret: subscription.latest_invoice.payment_intent.client_secret,
        customerId: customer.id
      }
    })
  } catch (error) {
    console.error('Error creating subscription:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to create subscription'
    })
  }
})

// Cancel subscription
router.post('/cancel-subscription', authenticateToken, async (req, res) => {
  try {
    const { subscriptionId } = req.body
    
    if (!subscriptionId) {
      return res.status(400).json({
        success: false,
        message: 'Subscription ID is required'
      })
    }

    const canceledSubscription = await StripeService.cancelSubscription(subscriptionId)

    res.json({
      success: true,
      message: 'Subscription canceled successfully',
      data: canceledSubscription
    })
  } catch (error) {
    console.error('Error canceling subscription:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to cancel subscription'
    })
  }
})

// Webhook endpoint for Stripe events
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const signature = req.headers['stripe-signature']
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
  
  if (!webhookSecret) {
    console.error('Webhook secret not configured')
    return res.status(500).send('Webhook secret not configured')
  }

  try {
    const event = StripeService.constructEvent(req.body, signature, webhookSecret)
    
    // Process the event
    const result = await StripeService.processWebhookEvent(event)
    
    res.json(result)
  } catch (error) {
    console.error('Webhook error:', error.message)
    res.status(400).send(`Webhook Error: ${error.message}`)
  }
})

// Get payment status
router.get('/payment-status/:paymentIntentId', authenticateToken, async (req, res) => {
  try {
    const { paymentIntentId } = req.params
    
    const paymentIntent = await StripeService.retrievePaymentIntent(paymentIntentId)
    
    res.json({
      success: true,
      data: {
        status: paymentIntent.status,
        amount: paymentIntent.amount / 100, // Convert from cents
        currency: paymentIntent.currency,
        metadata: paymentIntent.metadata
      }
    })
  } catch (error) {
    console.error('Error retrieving payment status:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve payment status'
    })
  }
})

export default router