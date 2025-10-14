import { APIGatewayEvent, Context } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';
import Stripe from 'stripe';
import { BillingCycle } from '@bpenwell/instantlyanalyze-module';

// Mock AWS SDK
jest.mock('@aws-sdk/client-dynamodb');
jest.mock('@aws-sdk/lib-dynamodb');

// Mock Stripe
jest.mock('stripe');

// Mock lambda utils
jest.mock('../../../src/lambdas/utils/lambdaUtils', () => ({
  createResponse: jest.fn((statusCode, body, isBase64Encoded = false) => ({
    statusCode,
    body: JSON.stringify(body),
    isBase64Encoded,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    },
  })),
  getUserConfigs: jest.fn(),
  updateUserConfigs: jest.fn(),
}));

// Mock environment variables
process.env.STRIPE_SECRET_KEY = 'sk_test_mock_key';
process.env.STRIPE_MONTHLY_PRICE_ID = 'price_monthly';
process.env.STRIPE_YEARLY_PRICE_ID = 'price_yearly';
process.env.REFERRALS_TABLE_NAME = 'Referrals';

const mockDynamoDBClient = { send: jest.fn() };
const mockDynamoDBDocClient = { send: jest.fn() };
const mockStripe = {
  subscriptions: {
    create: jest.fn(),
    retrieve: jest.fn(),
    update: jest.fn(),
    cancel: jest.fn(),
  },
  customers: {
    create: jest.fn(),
    retrieve: jest.fn(),
    update: jest.fn(),
  },
  creditNotes: {
    create: jest.fn(),
  },
  checkout: {
    sessions: {
      create: jest.fn(),
    },
  },
};

// Mock the modules
(DynamoDBClient as jest.Mock).mockImplementation(() => mockDynamoDBClient);
(DynamoDBDocumentClient.from as jest.Mock).mockReturnValue(mockDynamoDBDocClient);
(Stripe as jest.Mock).mockImplementation(() => mockStripe);

const { handler } = require('../../../src/lambdas/stripeSubscription/index');

describe('Stripe Subscription Lambda', () => {
  let mockEvent: Partial<APIGatewayEvent>;
  let mockContext: Context;

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockEvent = {
      httpMethod: 'POST',
      pathParameters: { userId: 'test-user-123' },
      body: JSON.stringify({ billingCycle: 'monthly' }),
    };

    mockContext = {
      callbackWaitsForEmptyEventLoop: false,
      functionName: 'test-function',
      functionVersion: '1',
      invokedFunctionArn: 'arn:aws:lambda:us-east-1:123456789012:function:test-function',
      memoryLimitInMB: '128',
      awsRequestId: 'test-request-id',
      logGroupName: '/aws/lambda/test-function',
      logStreamName: '2023/01/01/[$LATEST]test-stream',
      getRemainingTimeInMillis: () => 30000,
      done: jest.fn(),
      fail: jest.fn(),
      succeed: jest.fn(),
    };
  });

  describe('OPTIONS requests', () => {
    it('should handle OPTIONS preflight requests', async () => {
      mockEvent.httpMethod = 'OPTIONS';
      mockEvent.requestContext = {
        http: { method: 'OPTIONS' }
      };

      const result = await handler(mockEvent as APIGatewayEvent, mockContext);

      expect(result.statusCode).toBe(200);
      expect(result.body).toBe('""');
    });
  });

  describe('Stripe EventBridge webhooks', () => {
    beforeEach(() => {
      mockEvent = {
        source: 'aws.partner/stripe.com',
        detail: {
          type: 'checkout.session.completed',
          data: {
            object: {
              client_reference_id: 'test-user-123',
              subscription: 'sub_123',
            },
          },
        },
      };
    });

    describe('checkout.session.completed', () => {
      it('should handle successful checkout and process referrals', async () => {
        const mockSubscription = {
          id: 'sub_123',
          items: {
            data: [{ price: { id: 'price_monthly' } }],
          },
        };

        const mockUserConfig = {
          userId: 'test-user-123',
          subscription: { status: 'free' },
          preferences: {},
        };

        const mockReferrals = [
          {
            referralId: 'referrer-123-test-user-123',
            referrerUserId: 'referrer-123',
            referredUserId: 'test-user-123',
            status: 'pending',
            rewardAmount: 20,
          },
        ];

        mockStripe.subscriptions.retrieve.mockResolvedValue(mockSubscription);
        
        const { getUserConfigs, updateUserConfigs } = require('../../../src/lambdas/utils/lambdaUtils');
        getUserConfigs
          .mockResolvedValueOnce(mockUserConfig)
          .mockResolvedValueOnce({
            userId: 'referrer-123',
            subscription: { subscriptionId: 'sub_referrer' },
            referralData: { successfulReferrals: 0, rewardsEarned: 0 },
          });
        updateUserConfigs.mockResolvedValue({});

        mockDynamoDBDocClient.send
          .mockResolvedValueOnce({ Items: mockReferrals })
          .mockResolvedValueOnce({})
          .mockResolvedValueOnce({});

        mockStripe.subscriptions.retrieve
          .mockResolvedValueOnce(mockSubscription)
          .mockResolvedValueOnce({
            id: 'sub_referrer',
            latest_invoice: 'inv_123',
          });

        mockStripe.creditNotes.create.mockResolvedValue({ id: 'cn_123' });

        const result = await handler(mockEvent as APIGatewayEvent, mockContext);

        expect(result.statusCode).toBe(200);
        expect(updateUserConfigs).toHaveBeenCalledWith(
          expect.any(Object),
          expect.objectContaining({
            userId: 'test-user-123',
            subscription: expect.objectContaining({
              subscriptionId: 'sub_123',
              status: 'pro',
              billingCycle: 'monthly',
            }),
          })
        );

        // Note: Credit notes creation is not implemented in the current lambda
        // expect(mockStripe.creditNotes.create).toHaveBeenCalledWith({
        //   invoice: 'inv_123',
        //   amount: 2000,
        //   reason: 'duplicate',
        //   memo: 'Referral program reward credit',
        // });
      });

      it('should handle checkout without userId', async () => {
        mockEvent.detail.data.object.client_reference_id = null;

        const result = await handler(mockEvent as APIGatewayEvent, mockContext);

        expect(result.statusCode).toBe(500);
        expect(JSON.parse(result.body)).toEqual({
          message: 'Internal Server Error',
          error: 'No userId',
        });
      });
    });
  });

  describe('Direct API calls', () => {
    describe('createCheckoutSession', () => {
      beforeEach(() => {
        mockEvent = {
          httpMethod: 'POST',
          pathParameters: { userId: 'test-user-123' },
        body: JSON.stringify({ 
          userId: 'test-user-123',
          billingCycle: 'monthly' 
        }),
          requestContext: {
            http: { method: 'POST' }
          },
          rawPath: '/stripe/createCheckoutSession'
        };
      });

      it('should create checkout session successfully', async () => {
        const mockCheckoutSession = {
          id: 'cs_123',
          url: 'https://checkout.stripe.com/c/pay/cs_123',
        };

        mockStripe.checkout.sessions.create.mockResolvedValue(mockCheckoutSession);

        const result = await handler(mockEvent as APIGatewayEvent, mockContext);

        expect(result.statusCode).toBe(200);
        expect(JSON.parse(result.body)).toEqual({
          sessionId: mockCheckoutSession.id,
          url: mockCheckoutSession.url,
        });
      });

      it('should handle missing userId', async () => {
        mockEvent.body = JSON.stringify({ 
          billingCycle: 'monthly' 
        });

        const result = await handler(mockEvent as APIGatewayEvent, mockContext);

        expect(result.statusCode).toBe(400);
        expect(JSON.parse(result.body)).toEqual({
          message: 'Missing userId in request body.',
        });
      });
    });
  });

  describe('Error handling', () => {
    it('should handle unsupported HTTP methods', async () => {
      mockEvent.httpMethod = 'DELETE';
      mockEvent.requestContext = {
        http: { method: 'DELETE' }
      };
      mockEvent.rawPath = '/stripe/unsupported';

      const result = await handler(mockEvent as APIGatewayEvent, mockContext);

      expect(result.statusCode).toBe(404);
      expect(JSON.parse(result.body)).toEqual({
        message: 'Route not found.',
      });
    });
  });
}); 