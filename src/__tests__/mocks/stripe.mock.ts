// Stripe payment processing mock for testing

/**
 * Comprehensive Stripe mock for testing payment functionality
 * Provides all methods used in the application with proper jest mocks
 */

// Mock payment state
let mockPaymentState = {
  paymentIntents: new Map(),
  subscriptions: new Map(),
  customers: new Map(),
  paymentMethods: new Map()
};

const mockStripe = {
  // Elements and UI components
  elements: jest.fn((options?: any) => {
    console.log('💳 Mock Stripe elements created', options);
    
    const mockElements = {
      create: jest.fn((type: string, options?: any) => {
        console.log(`🔧 Mock Stripe element created: ${type}`, options);
        
        return {
          // Element mounting and unmounting
          mount: jest.fn((selector: string) => {
            console.log(`🎯 Mock Stripe element mounted: ${type} to ${selector}`);
          }),
          unmount: jest.fn(() => {
            console.log(`🔌 Mock Stripe element unmounted: ${type}`);
          }),
          destroy: jest.fn(() => {
            console.log(`💥 Mock Stripe element destroyed: ${type}`);
          }),
          
          // Element events
          on: jest.fn((event: string, handler: Function) => {
            console.log(`👂 Mock Stripe element event listener: ${type} - ${event}`);
            
            // Simulate events for testing
            setTimeout(() => {
              if (event === 'ready') {
                handler({ elementType: type });
              } else if (event === 'change') {
                handler({
                  elementType: type,
                  empty: false,
                  complete: true,
                  error: null
                });
              }
            }, 100);
          }),
          
          off: jest.fn((event: string, handler?: Function) => {
            console.log(`🔇 Mock Stripe element event listener removed: ${type} - ${event}`);
          }),
          
          // Element updates
          update: jest.fn((options: any) => {
            console.log(`🔄 Mock Stripe element updated: ${type}`, options);
          }),
          
          // Element focus and blur
          focus: jest.fn(() => {
            console.log(`🎯 Mock Stripe element focused: ${type}`);
          }),
          blur: jest.fn(() => {
            console.log(`😴 Mock Stripe element blurred: ${type}`);
          }),
          
          // Element clear
          clear: jest.fn(() => {
            console.log(`🧹 Mock Stripe element cleared: ${type}`);
          })
        };
      }),
      
      // Form submission
      submit: jest.fn(() => {
        console.log('📝 Mock Stripe elements submit');
        return Promise.resolve({ error: null });
      }),
      
      // Elements update
      update: jest.fn((options: any) => {
        console.log('🔄 Mock Stripe elements updated', options);
      }),
      
      // Fetch updates
      fetchUpdates: jest.fn(() => {
        console.log('🔄 Mock Stripe elements fetchUpdates');
        return Promise.resolve({});
      })
    };
    
    return mockElements;
  }),

  // Payment confirmation
  confirmPayment: jest.fn(({ elements, confirmParams, redirect }: any) => {
    console.log('💰 Mock Stripe confirmPayment', { confirmParams, redirect });
    
    return Promise.resolve({
      paymentIntent: {
        id: `pi_mock_${Math.random().toString(36).substr(2, 9)}`,
        status: 'succeeded',
        amount: 2999,
        currency: 'usd',
        payment_method: 'pm_mock_card',
        client_secret: 'pi_mock_client_secret'
      },
      error: null
    });
  }),

  confirmCardPayment: jest.fn((clientSecret: string, data?: any) => {
    console.log('💳 Mock Stripe confirmCardPayment', clientSecret);
    
    return Promise.resolve({
      paymentIntent: {
        id: `pi_mock_${Math.random().toString(36).substr(2, 9)}`,
        status: 'succeeded',
        amount: 2999,
        currency: 'usd',
        payment_method: 'pm_mock_card',
        client_secret: clientSecret
      },
      error: null
    });
  }),

  // Setup intents (for subscriptions)
  confirmSetupIntent: jest.fn((clientSecret: string, data?: any) => {
    console.log('🔧 Mock Stripe confirmSetupIntent', clientSecret);
    
    return Promise.resolve({
      setupIntent: {
        id: `seti_mock_${Math.random().toString(36).substr(2, 9)}`,
        status: 'succeeded',
        payment_method: 'pm_mock_card',
        client_secret: clientSecret
      },
      error: null
    });
  }),

  // Payment method creation
  createPaymentMethod: jest.fn(({ type, card, billing_details }: any) => {
    console.log('💳 Mock Stripe createPaymentMethod', { type, billing_details });
    
    return Promise.resolve({
      paymentMethod: {
        id: `pm_mock_${Math.random().toString(36).substr(2, 9)}`,
        type,
        card: {
          brand: 'visa',
          last4: '4242',
          exp_month: 12,
          exp_year: 2025,
          funding: 'credit'
        },
        billing_details: billing_details || {}
      },
      error: null
    });
  }),

  // Payment method retrieval
  retrievePaymentMethod: jest.fn((paymentMethodId: string) => {
    console.log('🔍 Mock Stripe retrievePaymentMethod', paymentMethodId);
    
    return Promise.resolve({
      paymentMethod: {
        id: paymentMethodId,
        type: 'card',
        card: {
          brand: 'visa',
          last4: '4242',
          exp_month: 12,
          exp_year: 2025,
          funding: 'credit'
        }
      },
      error: null
    });
  }),

  // Price lookup
  retrievePrice: jest.fn((priceId: string) => {
    console.log('💰 Mock Stripe retrievePrice', priceId);
    
    const mockPrices: Record<string, any> = {
      'price_premium_monthly': {
        id: 'price_premium_monthly',
        unit_amount: 999,
        currency: 'usd',
        recurring: { interval: 'month' },
        product: 'prod_premium'
      },
      'price_ultimate_monthly': {
        id: 'price_ultimate_monthly',
        unit_amount: 2999,
        currency: 'usd',
        recurring: { interval: 'month' },
        product: 'prod_ultimate'
      }
    };
    
    return Promise.resolve({
      price: mockPrices[priceId] || {
        id: priceId,
        unit_amount: 999,
        currency: 'usd'
      },
      error: null
    });
  }),

  // Subscription management
  retrieveSubscription: jest.fn((subscriptionId: string) => {
    console.log('📋 Mock Stripe retrieveSubscription', subscriptionId);
    
    return Promise.resolve({
      subscription: {
        id: subscriptionId,
        status: 'active',
        current_period_start: Math.floor(Date.now() / 1000),
        current_period_end: Math.floor(Date.now() / 1000) + 2592000, // 30 days
        items: {
          data: [
            {
              price: {
                id: 'price_premium_monthly',
                unit_amount: 999,
                currency: 'usd'
              }
            }
          ]
        }
      },
      error: null
    });
  }),

  // Customer portal
  redirectToCheckout: jest.fn(({ sessionId }: any) => {
    console.log('🛒 Mock Stripe redirectToCheckout', sessionId);
    // In real implementation, this would redirect to Stripe Checkout
    window.location.href = `https://checkout.stripe.com/pay/${sessionId}`;
    return Promise.resolve({ error: null });
  }),

  // Radar (fraud detection)
  radar: {
    earlyFraudWarnings: {
      list: jest.fn(() => {
        console.log('⚠️ Mock Stripe radar earlyFraudWarnings.list');
        return Promise.resolve({
          data: [],
          has_more: false
        });
      })
    }
  },

  // Webhooks
  webhooks: {
    constructEvent: jest.fn((payload: string, signature: string, secret: string) => {
      console.log('🪝 Mock Stripe webhooks.constructEvent');
      return {
        id: `evt_mock_${Math.random().toString(36).substr(2, 9)}`,
        type: 'payment_intent.succeeded',
        data: {
          object: {
            id: `pi_mock_${Math.random().toString(36).substr(2, 9)}`,
            status: 'succeeded'
          }
        },
        created: Math.floor(Date.now() / 1000)
      };
    })
  },

  // ApplePay and GooglePay
  paymentRequest: jest.fn((options: any) => {
    console.log('📱 Mock Stripe paymentRequest', options);
    
    return {
      canMakePayment: jest.fn(() => {
        console.log('❓ Mock Stripe paymentRequest.canMakePayment');
        return Promise.resolve({ applePay: true, googlePay: false });
      }),
      
      on: jest.fn((event: string, handler: Function) => {
        console.log(`👂 Mock Stripe paymentRequest.on: ${event}`);
        
        if (event === 'paymentmethod') {
          // Simulate payment method event
          setTimeout(() => {
            handler({
              paymentMethod: {
                id: `pm_mock_${Math.random().toString(36).substr(2, 9)}`,
                type: 'card',
                card: { brand: 'visa', last4: '4242' }
              },
              complete: jest.fn((status: string) => {
                console.log(`✅ Mock Stripe payment complete: ${status}`);
              })
            });
          }, 100);
        }
      }),
      
      show: jest.fn(() => {
        console.log('📱 Mock Stripe paymentRequest.show');
      }),
      
      update: jest.fn((options: any) => {
        console.log('🔄 Mock Stripe paymentRequest.update', options);
      })
    };
  }),

  // Error types for testing
  errors: {
    StripeCardError: class MockStripeCardError extends Error {
      type = 'card_error';
      code: string;
      decline_code?: string;
      param?: string;
      
      constructor(message: string, code: string) {
        super(message);
        this.code = code;
        this.name = 'StripeCardError';
      }
    },
    
    StripeInvalidRequestError: class MockStripeInvalidRequestError extends Error {
      type = 'invalid_request_error';
      param?: string;
      
      constructor(message: string, param?: string) {
        super(message);
        this.param = param;
        this.name = 'StripeInvalidRequestError';
      }
    }
  },

  // Internal methods for testing
  _mockReset: jest.fn(() => {
    mockPaymentState = {
      paymentIntents: new Map(),
      subscriptions: new Map(),
      customers: new Map(),
      paymentMethods: new Map()
    };
    console.log('🧹 Mock Stripe reset');
  }),

  _mockSetPaymentIntent: jest.fn((id: string, paymentIntent: any) => {
    mockPaymentState.paymentIntents.set(id, paymentIntent);
    console.log(`💰 Mock Stripe payment intent set: ${id}`);
  }),

  _mockSetSubscription: jest.fn((id: string, subscription: any) => {
    mockPaymentState.subscriptions.set(id, subscription);
    console.log(`📋 Mock Stripe subscription set: ${id}`);
  }),

  _mockTriggerError: jest.fn((errorType: 'card_error' | 'invalid_request_error', message: string) => {
    console.log(`❌ Mock Stripe error trigger: ${errorType} - ${message}`);
    if (errorType === 'card_error') {
      throw new mockStripe.errors.StripeCardError(message, 'card_declined');
    } else {
      throw new mockStripe.errors.StripeInvalidRequestError(message);
    }
  })
};

// Factory function for creating Stripe instance
export const loadStripe = jest.fn((publishableKey: string, options?: any) => {
  console.log(`💳 Mock Stripe loaded: ${publishableKey}`, options);
  return Promise.resolve(mockStripe);
});

// For direct Stripe object mocking
export const Stripe = mockStripe;

export default mockStripe;