<template>
  <div v-if="show" class="payment-modal-overlay" @click.self="closeModal">
    <div class="payment-modal">
      <div class="payment-header">
        <h2>Upgrade to Pro</h2>
        <button @click="closeModal" class="close-btn">
          <i class="fas fa-times"></i>
        </button>
      </div>
      
      <div class="payment-content">
        <!-- Plan Summary -->
        <div class="plan-summary">
          <div class="plan-info">
            <h3>Pro Plan</h3>
            <div class="price-display">
              <span class="price">€7.99</span>
              <span class="interval">/month</span>
            </div>
          </div>
          <div class="plan-features">
            <div class="feature-item">
              <i class="fas fa-check"></i>
              <span>Unlimited tournaments</span>
            </div>
            <div class="feature-item">
              <i class="fas fa-check"></i>
              <span>Unlimited worlds</span>
            </div>
            <div class="feature-item">
              <i class="fas fa-check"></i>
              <span>Player & stats editing</span>
            </div>
            <div class="feature-item">
              <i class="fas fa-check"></i>
              <span>Advanced analytics</span>
            </div>
          </div>
        </div>
        
        <!-- Payment Form -->
        <div class="payment-form">
          <h4>Payment Information</h4>
          
          <!-- Stripe Elements Container -->
          <div class="form-group">
            <label>Card Information</label>
            <div id="card-element" class="stripe-element">
              <!-- Stripe Elements will create form elements here -->
            </div>
            <div id="card-errors" class="stripe-errors"></div>
          </div>
          
          <!-- Billing Info -->
          <div class="form-group">
            <label for="cardholder-name">Cardholder Name</label>
            <input 
              type="text" 
              id="cardholder-name" 
              v-model="cardDetails.name"
              placeholder="John Doe"
              class="payment-input"
            />
          </div>
          
          <div class="form-group">
            <label for="email">Email Address</label>
            <input 
              type="email" 
              id="email" 
              v-model="cardDetails.email"
              placeholder="john.doe@example.com"
              class="payment-input"
            />
          </div>
        </div>
        
        <!-- Security Notice -->
        <div class="security-notice">
          <i class="fas fa-shield-alt"></i>
          <span>Your payment information is encrypted and secure</span>
        </div>
        
        <!-- Payment Actions -->
        <div class="payment-actions">
          <button @click="closeModal" class="btn-cancel">
            Cancel
          </button>
          <button 
            @click="processPayment" 
            :disabled="!isFormValid || processing"
            class="btn-pay"
          >
            <i v-if="processing" class="fas fa-spinner fa-spin"></i>
            <i v-else class="fas fa-credit-card"></i>
            <span v-if="processing">Processing...</span>
            <span v-else>Pay €7.99/month</span>
          </button>
        </div>
        
        <!-- Terms -->
        <div class="payment-terms">
          <small>
            By continuing, you agree to our 
            <a href="#" @click.prevent>Terms of Service</a> and 
            <a href="#" @click.prevent>Privacy Policy</a>. 
            You can cancel anytime in your account settings.
          </small>
        </div>
        
        <p v-if="errorMessage" class="error-message">{{ errorMessage }}</p>
      </div>
    </div>
  </div>
</template>

<script>
import { API_URL } from '../config/api.js'

// Load Stripe.js
const stripePromise = import('https://js.stripe.com/v3/').then(module => {
  return module.loadStripe(process.env.VUE_APP_STRIPE_PUBLISHABLE_KEY || 'pk_test_...')
})

export default {
  name: 'PaymentModal',
  props: {
    show: {
      type: Boolean,
      default: false
    }
  },
  data() {
    return {
      processing: false,
      errorMessage: '',
      stripe: null,
      elements: null,
      cardElement: null,
      clientSecret: null,
      cardDetails: {
        name: '',
        email: ''
      }
    }
  },
  computed: {
    isFormValid() {
      return (
        this.cardDetails.name.trim().length > 0 &&
        this.cardDetails.email.includes('@') &&
        this.cardElement
      )
    }
  },
  methods: {
    async initializeStripe() {
      try {
        this.stripe = await stripePromise
        this.elements = this.stripe.elements()
        
        // Create card element
        this.cardElement = this.elements.create('card', {
          style: {
            base: {
              fontSize: '16px',
              color: '#424770',
              '::placeholder': {
                color: '#aab7c4',
              },
            },
            invalid: {
              color: '#9e2146',
            },
          },
        })
        
        // Mount the card element
        this.cardElement.mount('#card-element')
        
        // Listen for real-time validation errors from the card Element
        this.cardElement.on('change', (event) => {
          const displayError = document.getElementById('card-errors')
          if (event.error) {
            displayError.textContent = event.error.message
            this.errorMessage = event.error.message
          } else {
            displayError.textContent = ''
            this.errorMessage = ''
          }
        })
      } catch (error) {
        console.error('Error initializing Stripe:', error)
        this.errorMessage = 'Failed to load payment system'
      }
    },
    
    closeModal() {
      this.$emit('close')
      this.resetForm()
    },
    
    resetForm() {
      this.cardDetails = {
        name: '',
        email: ''
      }
      this.errorMessage = ''
      this.processing = false
      this.clientSecret = null
      
      // Clear Stripe elements
      if (this.cardElement) {
        this.cardElement.clear()
      }
    },
    
    async processPayment() {
      this.processing = true
      this.errorMessage = ''
      
      try {
        // Step 1: Create payment intent on backend
        if (!this.clientSecret) {
          await this.createPaymentIntent()
        }
        
        // Step 2: Confirm payment with Stripe
        const { error, paymentIntent } = await this.stripe.confirmCardPayment(this.clientSecret, {
          payment_method: {
            card: this.cardElement,
            billing_details: {
              name: this.cardDetails.name,
              email: this.cardDetails.email,
            },
          }
        })
        
        if (error) {
          throw new Error(error.message)
        }
        
        if (paymentIntent.status === 'succeeded') {
          // Payment successful - webhook will handle membership upgrade
          this.$emit('payment-success')
          this.closeModal()
        } else {
          throw new Error('Payment was not completed successfully')
        }
        
      } catch (error) {
        console.error('Payment error:', error)
        this.errorMessage = error.message || 'Payment failed. Please try again.'
      } finally {
        this.processing = false
      }
    },
    
    async createPaymentIntent() {
      const token = localStorage.getItem('token')
      const response = await fetch(`${API_URL}/payment/create-payment-intent`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          amount: 7.99, // €7.99
          plan: 'pro'
        })
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to create payment intent')
      }
      
      this.clientSecret = data.data.clientSecret
    }
  },
  
  async mounted() {
    await this.initializeStripe()
  },
  
  watch: {
    async show(newVal) {
      if (newVal) {
        // Pre-fill email if user is logged in
        const username = localStorage.getItem('username')
        if (username) {
          // Try to construct email from username (this is just a demo)
          this.cardDetails.email = `${username}@example.com`
        }
        
        // Initialize Stripe if not already done
        if (!this.stripe) {
          await this.initializeStripe()
        }
      }
    }
  }
}
</script>

<style scoped>
.payment-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
  padding: 20px;
  backdrop-filter: blur(5px);
}

.payment-modal {
  background: white;
  border-radius: var(--radius-xl);
  max-width: 500px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 25px 50px rgba(0, 0, 0, 0.3);
}

.payment-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24px 32px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.1);
}

.payment-header h2 {
  color: var(--fifa-dark-blue);
  font-size: 1.5rem;
  font-weight: var(--font-weight-bold);
  margin: 0;
}

.close-btn {
  background: none;
  border: none;
  font-size: 1.2rem;
  color: var(--gray);
  cursor: pointer;
  padding: 8px;
  border-radius: var(--radius-md);
  transition: all 0.3s ease;
}

.close-btn:hover {
  color: var(--fifa-red);
  background: rgba(255, 68, 68, 0.1);
}

.payment-content {
  padding: 32px;
}

.plan-summary {
  background: linear-gradient(135deg, var(--fifa-blue), var(--fifa-light-blue));
  color: white;
  padding: 24px;
  border-radius: var(--radius-lg);
  margin-bottom: 32px;
}

.plan-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.plan-info h3 {
  font-size: 1.3rem;
  font-weight: var(--font-weight-bold);
  margin: 0;
}

.price-display {
  display: flex;
  align-items: baseline;
  gap: 4px;
}

.price {
  font-size: 1.5rem;
  font-weight: var(--font-weight-bold);
}

.interval {
  font-size: 0.9rem;
  opacity: 0.9;
}

.plan-features {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 12px;
}

.feature-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.9rem;
}

.feature-item i {
  color: var(--fifa-yellow);
  font-size: 0.8rem;
}

.payment-form h4 {
  color: var(--fifa-dark-blue);
  font-size: 1.1rem;
  font-weight: var(--font-weight-bold);
  margin: 0 0 20px 0;
}

.form-group {
  margin-bottom: 20px;
}

.form-row {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 16px;
}

.form-group label {
  display: block;
  margin-bottom: 6px;
  color: var(--fifa-dark-blue);
  font-weight: var(--font-weight-semibold);
  font-size: 0.9rem;
}

.payment-input {
  width: 100%;
  padding: 12px 16px;
  border: 2px solid #e0e6ed;
  border-radius: var(--radius-md);
  font-size: 1rem;
  transition: all 0.3s ease;
  background: white;
}

.payment-input:focus {
  outline: none;
  border-color: var(--fifa-blue);
  box-shadow: 0 0 0 3px rgba(0, 102, 204, 0.1);
}

/* Stripe Elements Styles */
.stripe-element {
  padding: 12px 16px;
  border: 2px solid #e0e6ed;
  border-radius: var(--radius-md);
  background: white;
  transition: all 0.3s ease;
}

.stripe-element:focus-within {
  border-color: var(--fifa-blue);
  box-shadow: 0 0 0 3px rgba(0, 102, 204, 0.1);
}

.stripe-errors {
  color: var(--fifa-red);
  font-size: 0.875rem;
  margin-top: 8px;
  min-height: 20px;
}

.security-notice {
  display: flex;
  align-items: center;
  gap: 8px;
  background: rgba(0, 170, 68, 0.1);
  color: #00aa44;
  padding: 12px 16px;
  border-radius: var(--radius-md);
  font-size: 0.9rem;
  font-weight: var(--font-weight-medium);
  margin-bottom: 24px;
}

.security-notice i {
  font-size: 1rem;
}

.payment-actions {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
}

.btn-cancel {
  flex: 1;
  padding: 14px 24px;
  background: transparent;
  border: 2px solid #e0e6ed;
  color: var(--gray);
  border-radius: var(--radius-md);
  font-weight: var(--font-weight-semibold);
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-cancel:hover {
  border-color: var(--gray);
  background: rgba(108, 117, 125, 0.1);
}

.btn-pay {
  flex: 2;
  padding: 14px 24px;
  background: linear-gradient(135deg, var(--fifa-blue), var(--fifa-light-blue));
  color: white;
  border: none;
  border-radius: var(--radius-md);
  font-weight: var(--font-weight-bold);
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.btn-pay:hover:not(:disabled) {
  background: linear-gradient(135deg, var(--fifa-light-blue), var(--fifa-blue));
  transform: translateY(-1px);
  box-shadow: 0 6px 20px rgba(0, 102, 204, 0.3);
}

.btn-pay:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

.payment-terms {
  text-align: center;
  color: var(--gray);
  font-size: 0.8rem;
  line-height: 1.4;
}

.payment-terms a {
  color: var(--fifa-blue);
  text-decoration: none;
}

.payment-terms a:hover {
  text-decoration: underline;
}

.error-message {
  color: var(--fifa-red);
  text-align: center;
  margin-top: 16px;
  padding: 12px;
  background: rgba(255, 68, 68, 0.1);
  border-radius: var(--radius-md);
  border: 1px solid rgba(255, 68, 68, 0.2);
  font-weight: var(--font-weight-medium);
}

@media (max-width: 768px) {
  .payment-modal {
    margin: 10px;
  }
  
  .payment-header {
    padding: 20px 24px;
  }
  
  .payment-content {
    padding: 24px;
  }
  
  .plan-info {
    flex-direction: column;
    text-align: center;
    gap: 12px;
  }
  
  .plan-features {
    grid-template-columns: 1fr;
    gap: 8px;
  }
  
  .form-row {
    grid-template-columns: 1fr;
  }
  
  .payment-actions {
    flex-direction: column;
  }
}

@media (max-width: 480px) {
  .payment-modal-overlay {
    padding: 10px;
  }
  
  .payment-header {
    padding: 16px 20px;
  }
  
  .payment-header h2 {
    font-size: 1.3rem;
  }
  
  .payment-content {
    padding: 20px;
  }
  
  .plan-summary {
    padding: 20px;
  }
}
</style>