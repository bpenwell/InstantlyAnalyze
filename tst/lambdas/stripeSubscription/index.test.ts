import { handler } from '../../../src/lambdas/stripeSubscription/index';
import { APIGatewayEvent, Context } from 'aws-lambda';

// Mock AWS SDK
jest.mock('@aws-sdk/client-dynamodb', () => ({
  DynamoDBClient: jest.fn().mockImplementation(() => ({})),
}));

// Mock instantlyanalyze module
jest.mock('@bpenwell/instantlyanalyze-module', () => ({
  BillingCycle: {
    MONTHLY: 'MONTHLY',
    YEARLY: 'YEARLY',
  },
  toUpperCamelCase: jest.fn((str) => str),
  UserStatus: {
    FREE: 'FREE',
    PRO: 'PRO',
  },
}));

// Mock lambda utils
jest.mock('../../../src/lambdas/utils/lambdaUtils', () => ({
  createResponse: jest.fn((statusCode, body, cors) => ({
    statusCode,
    body: JSON.stringify(body),
    headers: cors ? { 'Access-Control-Allow-Origin': '*' } : {},
  })),
  getUserConfigs: jest.fn().mockResolvedValue({
    userId: 'user123',
    subscription: {},
    preferences: {},
  }),
  updateUserConfigs: jest.fn().mockResolvedValue({}),
}));

// Mock Stripe
jest.mock('stripe', () => {
  return jest.fn().mockImplementation(() => ({
    subscriptions: {
      retrieve: jest.fn().mockResolvedValue({
        id: 'sub_123',
        items: {
          data: [
            {
              price: {
                id: 'price_monthly_123',
              },
            },
          ],
        },
      }),
      update: jest.fn(),
    },
    checkout: {
      sessions: {
        create: jest.fn(),
        retrieve: jest.fn(),
      },
    },
  }));
});

describe('Stripe Subscription Lambda', () => {
  const mockContext: Context = {
    callbackWaitsForEmptyEventLoop: false,
    functionName: 'test',
    functionVersion: '1',
    invokedFunctionArn: 'arn:aws:lambda:us-east-1:123456789012:function:test',
    memoryLimitInMB: '128',
    awsRequestId: 'test-request-id',
    logGroupName: 'test-log-group',
    logStreamName: 'test-log-stream',
    getRemainingTimeInMillis: () => 30000,
    done: jest.fn(),
    fail: jest.fn(),
    succeed: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    // Set required environment variables
    process.env.STRIPE_SECRET_KEY = 'sk_test_123';
    process.env.STRIPE_MONTHLY_PRICE_ID = 'price_monthly_123';
    process.env.STRIPE_YEARLY_PRICE_ID = 'price_yearly_123';
  });

  it('should handle OPTIONS requests', async () => {
    const event: APIGatewayEvent = {
      requestContext: {
        http: { method: 'OPTIONS' },
      },
    } as any;

    const result = await handler(event, mockContext);
    expect(result.statusCode).toBe(200);
  });

  it('should handle Stripe webhook events', async () => {
    const event = {
      source: 'aws.partner/stripe.com/webhook',
      detail: {
        type: 'checkout.session.completed',
        data: {
          object: {
            client_reference_id: 'user123',
            subscription: 'sub_123',
          },
        },
      },
    };

    const result = await handler(event, mockContext);
    expect(result.statusCode).toBe(200);
  });

  it('should return 404 for unhandled routes', async () => {
    const event: APIGatewayEvent = {
      rawPath: '/unknown-path',
      body: '{}',
    } as any;

    const result = await handler(event, mockContext);
    expect(result.statusCode).toBe(404);
  });
}); 