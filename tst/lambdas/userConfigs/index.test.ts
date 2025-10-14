import { APIGatewayEvent, Context } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';

// Mock AWS SDK
jest.mock('@aws-sdk/client-dynamodb');

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
  createUserConfig: jest.fn(),
}));

const mockDynamoDBClient = { send: jest.fn() };
(DynamoDBClient as jest.Mock).mockImplementation(() => mockDynamoDBClient);

const { handler } = require('../../../src/lambdas/userConfigs/index');

describe('User Configs Lambda', () => {
  let mockEvent: Partial<APIGatewayEvent>;
  let mockContext: Context;

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockEvent = {
      httpMethod: 'GET',
      pathParameters: { userId: 'test-user-123' },
      body: null,
      requestContext: {
        http: { method: 'GET' }
      },
      rawPath: '/userConfigs/getUser'
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
      mockEvent.requestContext!.http!.method = 'OPTIONS';

      const result = await handler(mockEvent as APIGatewayEvent, mockContext);

      expect(result.statusCode).toBe(200);
      expect(result.body).toBe('""');
    });
  });

  describe('GET /userConfigs/getUser', () => {
    it('should return user configs successfully', async () => {
      const mockUserConfig = {
        userId: 'test-user-123',
        subscription: { status: 'pro' },
        freeReportsAvailable: 5,
        preferences: {},
      };

      const { getUserConfigs } = require('../../../src/lambdas/utils/lambdaUtils');
      getUserConfigs.mockResolvedValue(mockUserConfig);

      const result = await handler(mockEvent as APIGatewayEvent, mockContext);

      expect(result.statusCode).toBe(200);
      expect(result.body).toBe(JSON.stringify(mockUserConfig));
      expect(getUserConfigs).toHaveBeenCalledWith(mockDynamoDBClient, 'test-user-123');
    });

    it('should return user not found message', async () => {
      const { getUserConfigs } = require('../../../src/lambdas/utils/lambdaUtils');
      getUserConfigs.mockRejectedValue(new Error('User not found'));

      const result = await handler(mockEvent as APIGatewayEvent, mockContext);

      expect(result.statusCode).toBe(200);
      expect(result.body).toBe(JSON.stringify({
        message: 'User not found',
      }));
    });

    it('should handle database errors', async () => {
      const { getUserConfigs } = require('../../../src/lambdas/utils/lambdaUtils');
      getUserConfigs.mockRejectedValue(new Error('Database connection failed'));

      const result = await handler(mockEvent as APIGatewayEvent, mockContext);

      expect(result.statusCode).toBe(500);
      expect(result.body).toBe(JSON.stringify({
        message: 'Internal Server Error',
        error: 'Database connection failed',
      }));
    });

    it('should handle missing userId', async () => {
      mockEvent.pathParameters = {};

      const result = await handler(mockEvent as APIGatewayEvent, mockContext);

      expect(result.statusCode).toBe(400);
      expect(result.body).toBe(JSON.stringify({
        message: 'User ID is required',
      }));
    });
  });

  describe('POST /userConfigs/updateUser', () => {
    beforeEach(() => {
      mockEvent.httpMethod = 'POST';
      mockEvent.requestContext!.http!.method = 'POST';
      mockEvent.rawPath = '/userConfigs/updateUser';
      mockEvent.body = JSON.stringify({
        userId: 'test-user-123',
        newUserConfig: {
          userId: 'test-user-123',
          subscription: { status: 'pro' },
          freeReportsAvailable: 3,
          preferences: {},
        },
      });
    });

    it('should update user configs successfully', async () => {
      const updatedConfig = {
        userId: 'test-user-123',
        subscription: { status: 'pro' },
        freeReportsAvailable: 3,
        preferences: {},
      };

      const { getUserConfigs, updateUserConfigs } = require('../../../src/lambdas/utils/lambdaUtils');
      updateUserConfigs.mockResolvedValue({});
      getUserConfigs.mockResolvedValue(updatedConfig);

      const result = await handler(mockEvent as APIGatewayEvent, mockContext);

      expect(result.statusCode).toBe(200);
      expect(result.body).toBe(JSON.stringify(updatedConfig));
      expect(updateUserConfigs).toHaveBeenCalledWith(
        mockDynamoDBClient,
        expect.objectContaining({
          userId: 'test-user-123',
          subscription: { status: 'pro' },
          freeReportsAvailable: 3,
        })
      );
    });

    it('should handle missing newUserConfig', async () => {
      mockEvent.body = JSON.stringify({
        userId: 'test-user-123'
      });

      const result = await handler(mockEvent as APIGatewayEvent, mockContext);

      expect(result.statusCode).toBe(400);
      expect(result.body).toBe(JSON.stringify({
        message: 'Missing newUserConfig in request body.',
      }));
    });

    it('should handle update errors', async () => {
      const { updateUserConfigs } = require('../../../src/lambdas/utils/lambdaUtils');
      updateUserConfigs.mockRejectedValue(new Error('Update failed'));

      const result = await handler(mockEvent as APIGatewayEvent, mockContext);

      expect(result.statusCode).toBe(500);
      expect(result.body).toBe(JSON.stringify({
        message: 'Internal Server Error',
        error: 'Update failed',
      }));
    });
  });

  describe('POST /userConfigs/createUser', () => {
    beforeEach(() => {
      mockEvent.httpMethod = 'POST';
      mockEvent.requestContext!.http!.method = 'POST';
      mockEvent.rawPath = '/userConfigs/createUser';
      mockEvent.body = JSON.stringify({
        userId: 'test-user-123'
      });
    });

    it('should create user config successfully', async () => {
      const newUserConfig = {
        userId: 'test-user-123',
        subscription: { status: 'free' },
        freeReportsAvailable: 3,
        freeZillowScrapesAvailable: 1,
        hasSeenWelcomePage: false,
        preferences: {
          appMode: 'light',
          appDensity: 'comfortable',
          tablePageSize: 10,
          zillowBuyBoxSets: [],
          rentalReportBuyBoxSets: [],
          defaultRentalInputs: {},
        },
      };

      const { createUserConfig } = require('../../../src/lambdas/utils/lambdaUtils');
      createUserConfig.mockResolvedValue(newUserConfig);

      const result = await handler(mockEvent as APIGatewayEvent, mockContext);

      expect(result.statusCode).toBe(201);
      expect(result.body).toBe(JSON.stringify(newUserConfig));
      expect(createUserConfig).toHaveBeenCalledWith(mockDynamoDBClient, 'test-user-123');
    });

    it('should handle creation errors', async () => {
      const { createUserConfig } = require('../../../src/lambdas/utils/lambdaUtils');
      createUserConfig.mockRejectedValue(new Error('Creation failed'));

      const result = await handler(mockEvent as APIGatewayEvent, mockContext);

      expect(result.statusCode).toBe(500);
      expect(result.body).toBe(JSON.stringify({
        message: 'Internal Server Error',
        error: 'Creation failed',
      }));
    });
  });

  describe('Error handling', () => {
    it('should handle unsupported routes', async () => {
      mockEvent.httpMethod = 'DELETE';
      mockEvent.requestContext!.http!.method = 'DELETE';
      mockEvent.rawPath = '/userConfigs/unsupported';
      mockEvent.body = JSON.stringify({
        userId: 'test-user-123'
      });

      const result = await handler(mockEvent as APIGatewayEvent, mockContext);

      expect(result.statusCode).toBe(404);
      expect(result.body).toBe(JSON.stringify({
        message: 'Route not found.',
      }));
    });

    it('should handle malformed JSON', async () => {
      mockEvent.httpMethod = 'POST';
      mockEvent.requestContext!.http!.method = 'POST';
      mockEvent.rawPath = '/userConfigs/updateUser';
      mockEvent.body = 'invalid json';

      const result = await handler(mockEvent as APIGatewayEvent, mockContext);

      expect(result.statusCode).toBe(500);
      expect(result.body).toBe(JSON.stringify({
        message: 'Internal Server Error',
        error: 'Unexpected token \'i\', "invalid json" is not valid JSON',
      }));
    });

    it('should handle general errors', async () => {
      // Mock a general error by making getUserConfigs throw
      const { getUserConfigs } = require('../../../src/lambdas/utils/lambdaUtils');
      getUserConfigs.mockImplementation(() => {
        throw new Error('Unexpected error');
      });

      const result = await handler(mockEvent as APIGatewayEvent, mockContext);

      expect(result.statusCode).toBe(500);
      expect(result.body).toBe(JSON.stringify({
        message: 'Internal Server Error',
        error: 'Unexpected error',
      }));
    });
  });
});