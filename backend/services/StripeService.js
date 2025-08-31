import Stripe from 'stripe'

// Initialize Stripe with your secret key
// In production, this should be stored in environment variables
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_...', {
  apiVersion: '2023-10-16'
})

class StripeService {
  constructor() {
    this.stripe = stripe
  }

  // Create a payment intent for the Pro subscription
  async createPaymentIntent(amount, currency = 'eur', metadata = {}) {
    try {
      const paymentIntent = await this.stripe.paymentIntents.create({
        amount: Math.round(amount * 100), // Convert to cents
        currency,
        metadata,
        automatic_payment_methods: {
          enabled: true,
        },
      })

      return paymentIntent
    } catch (error) {
      console.error('Error creating payment intent:', error)
      throw new Error('Failed to create payment intent')
    }
  }

  // Create a customer for recurring billing
  async createCustomer(email, name, metadata = {}) {
    try {
      const customer = await this.stripe.customers.create({
        email,
        name,
        metadata
      })

      return customer
    } catch (error) {
      console.error('Error creating customer:', error)
      throw new Error('Failed to create customer')
    }
  }

  // Create a subscription for recurring monthly billing
  async createSubscription(customerId, priceId, metadata = {}) {
    try {
      const subscription = await this.stripe.subscriptions.create({
        customer: customerId,
        items: [{
          price: priceId, // This should be created in Stripe Dashboard
        }],
        payment_behavior: 'default_incomplete',
        payment_settings: { save_default_payment_method: 'on_subscription' },
        expand: ['latest_invoice.payment_intent'],
        metadata
      })

      return subscription
    } catch (error) {
      console.error('Error creating subscription:', error)
      throw new Error('Failed to create subscription')
    }
  }

  // Retrieve payment intent
  async retrievePaymentIntent(paymentIntentId) {
    try {
      return await this.stripe.paymentIntents.retrieve(paymentIntentId)
    } catch (error) {
      console.error('Error retrieving payment intent:', error)
      throw new Error('Failed to retrieve payment intent')
    }
  }

  // Cancel subscription
  async cancelSubscription(subscriptionId) {
    try {
      return await this.stripe.subscriptions.cancel(subscriptionId)
    } catch (error) {
      console.error('Error canceling subscription:', error)
      throw new Error('Failed to cancel subscription')
    }
  }

  // Handle webhook events
  constructEvent(payload, signature, webhookSecret) {
    try {
      return this.stripe.webhooks.constructEvent(payload, signature, webhookSecret)
    } catch (error) {
      console.error('Error constructing webhook event:', error)
      throw new Error('Invalid webhook signature')
    }
  }

  // Process webhook event
  async processWebhookEvent(event) {
    console.log(`Processing webhook event: ${event.type}`)
    
    switch (event.type) {
      case 'payment_intent.succeeded':
        return await this.handlePaymentSucceeded(event.data.object)
      
      case 'invoice.payment_succeeded':
        return await this.handleSubscriptionPayment(event.data.object)
      
      case 'customer.subscription.deleted':
        return await this.handleSubscriptionCanceled(event.data.object)
      
      case 'invoice.payment_failed':
        return await this.handlePaymentFailed(event.data.object)
      
      default:
        console.log(`Unhandled event type: ${event.type}`)
        return { received: true }
    }
  }

  async handlePaymentSucceeded(paymentIntent) {
    console.log('Payment succeeded:', paymentIntent.id)
    
    // Update user's membership based on payment intent metadata
    const userId = paymentIntent.metadata.userId
    const plan = paymentIntent.metadata.plan
    
    if (userId && plan) {
      try {
        const MembershipService = (await import('./MembershipService.js')).default
        await MembershipService.updateMembershipPlan(userId, plan)
        console.log(`Updated user ${userId} to ${plan} plan`)
      } catch (error) {
        console.error('Error updating membership after payment:', error)
      }
    }
    
    return { processed: true }
  }

  async handleSubscriptionPayment(invoice) {
    console.log('Subscription payment succeeded:', invoice.id)
    
    // Handle recurring subscription payments
    const customerId = invoice.customer
    const subscriptionId = invoice.subscription
    
    // You might want to extend subscription period, send confirmation emails, etc.
    
    return { processed: true }
  }

  async handleSubscriptionCanceled(subscription) {
    console.log('Subscription canceled:', subscription.id)
    
    // Downgrade user to basic plan
    const userId = subscription.metadata.userId
    
    if (userId) {
      try {
        const MembershipService = (await import('./MembershipService.js')).default
        await MembershipService.updateMembershipPlan(userId, 'basic')
        console.log(`Downgraded user ${userId} to basic plan`)
      } catch (error) {
        console.error('Error downgrading membership after subscription cancel:', error)
      }
    }
    
    return { processed: true }
  }

  async handlePaymentFailed(invoice) {
    console.log('Payment failed:', invoice.id)
    
    // Handle failed payments - might want to send email notifications,
    // retry logic, or downgrade user after multiple failures
    
    return { processed: true }
  }
}

export default new StripeService()