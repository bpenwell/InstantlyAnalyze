import { APIGatewayEvent, Context } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';

// Mock AWS SDK
jest.mock('@aws-sdk/client-dynamodb');
jest.mock('@aws-sdk/lib-dynamodb');

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

// Mock lambda constants
jest.mock('../../../src/lambdas/utils/lambdaConstants', () => ({
  USER_ID_INDEX: 'UserIdIndex',
}));

const mockDynamoDBClient = { send: jest.fn() };
const mockDynamoDBDocClient = { send: jest.fn() };

(DynamoDBClient as jest.Mock).mockImplementation(() => mockDynamoDBClient);
(DynamoDBDocumentClient.from as jest.Mock).mockReturnValue(mockDynamoDBDocClient);

const { handler } = require('../../../src/lambdas/rentalReport/index');

describe('Rental Report Lambda', () => {
  let mockEvent: Partial<APIGatewayEvent>;
  let mockContext: Context;

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockEvent = {
      requestContext: {
        http: { method: 'POST' },
      },
      body: JSON.stringify({
        action: 'saveRentalReport',
        userId: 'test-user-123',
        reportData: {
          propertyInformation: {
            address: '123 Test St',
            city: 'Test City',
            state: 'CA',
            zipCode: '12345',
          },
          financialDetails: {
            purchasePrice: 300000,
            downPayment: 60000,
            interestRate: 6.5,
          },
        },
      }),
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
      mockEvent.requestContext!.http!.method = 'OPTIONS';

      const result = await handler(mockEvent as APIGatewayEvent, mockContext);

      expect(result.statusCode).toBe(200);
      expect(result.body).toBe('""');
    });
  });

  describe('saveRentalReport action', () => {
    it('should create rental report successfully for pro user', async () => {
      const mockUserConfig = {
        userId: 'test-user-123',
        subscription: { status: 'pro' },
        freeReportsAvailable: 5,
      };

      const { getUserConfigs, updateUserConfigs } = require('../../../src/lambdas/utils/lambdaUtils');
      getUserConfigs.mockResolvedValue(mockUserConfig);
      updateUserConfigs.mockResolvedValue({});

      mockDynamoDBDocClient.send.mockResolvedValue({});

      const result = await handler(mockEvent as APIGatewayEvent, mockContext);

      expect(result.statusCode).toBe(200);
      expect(result.body).toBe('{"message":"Report created"}');

      expect(mockDynamoDBDocClient.send).toHaveBeenCalledTimes(2);
      expect(mockDynamoDBDocClient.send).toHaveBeenCalledWith(expect.any(Object));
    });

    it('should create rental report for free user and decrement free reports', async () => {
      const mockUserConfig = {
        userId: 'test-user-123',
        subscription: { status: 'free' },
        freeReportsAvailable: 2,
      };

      const { getUserConfigs, updateUserConfigs } = require('../../../src/lambdas/utils/lambdaUtils');
      getUserConfigs.mockResolvedValue(mockUserConfig);
      updateUserConfigs.mockResolvedValue({});

      mockDynamoDBDocClient.send.mockResolvedValue({});

      const result = await handler(mockEvent as APIGatewayEvent, mockContext);

      expect(result.statusCode).toBe(200);
      expect(updateUserConfigs).toHaveBeenCalledWith(
        expect.any(Object),
        expect.objectContaining({
          freeReportsAvailable: 1,
        })
      );
    });

    it('should reject creation for free user with no reports available', async () => {
      const mockUserConfig = {
        userId: 'test-user-123',
        subscription: { status: 'free' },
        freeReportsAvailable: 0,
      };

      const { getUserConfigs } = require('../../../src/lambdas/utils/lambdaUtils');
      getUserConfigs.mockResolvedValue(mockUserConfig);

      const result = await handler(mockEvent as APIGatewayEvent, mockContext);

      expect(result.statusCode).toBe(200);
      expect(result.body).toBe('{"error":"NoFreeReportsLeftException"}');
    });

    it('should handle missing userId', async () => {
      mockEvent.body = JSON.stringify({
        action: 'saveRentalReport',
        reportData: {},
      });

      const result = await handler(mockEvent as APIGatewayEvent, mockContext);

      expect(result.statusCode).toBe(400);
      expect(result.body).toBe('{"error":"Missing userId"}');
    });

    it('should handle missing reportData', async () => {
      mockEvent.body = JSON.stringify({
        action: 'saveRentalReport',
        userId: 'test-user-123',
      });

      const result = await handler(mockEvent as APIGatewayEvent, mockContext);

      expect(result.statusCode).toBe(400);
      expect(result.body).toBe('{"error":"Missing reportData"}');
    });
  });

  describe('getRentalReport action', () => {
    beforeEach(() => {
      mockEvent.body = JSON.stringify({
        action: 'getRentalReport',
        reportId: 'report-123',
        userId: 'test-user-123',
      });
    });

    it('should get rental report successfully', async () => {
      const mockReport = {
        reportId: 'report-123',
        userId: 'test-user-123',
        reportData: {
          propertyInformation: {
            address: '123 Test St',
          },
        },
        createdAt: '2023-01-01T00:00:00Z',
      };

      mockDynamoDBDocClient.send.mockResolvedValue({ Item: mockReport });

      const result = await handler(mockEvent as APIGatewayEvent, mockContext);

      expect(result.statusCode).toBe(200);
      expect(result.body).toBe(JSON.stringify(mockReport));
    });

    it('should return 404 for non-existent report', async () => {
      mockDynamoDBDocClient.send.mockResolvedValue({ Item: undefined });

      const result = await handler(mockEvent as APIGatewayEvent, mockContext);

      expect(result.statusCode).toBe(404);
      expect(result.body).toBe('{"error":"Report not found"}');
    });

    it('should return 403 for unauthorized access', async () => {
      const mockReport = {
        reportId: 'report-123',
        userId: 'different-user-456',
        reportData: {},
      };

      mockDynamoDBDocClient.send.mockResolvedValue({ Item: mockReport });

      const result = await handler(mockEvent as APIGatewayEvent, mockContext);

      expect(result.statusCode).toBe(403);
      expect(JSON.parse(result.body)).toEqual({
        error: 'AccessDeniedException',
      });
    });
  });

  describe('getAllRentalReports action', () => {
    beforeEach(() => {
      mockEvent.body = JSON.stringify({
        action: 'getAllRentalReports',
        userId: 'test-user-123',
      });
    });

    it('should get all rental reports for user', async () => {
      const mockReports = [
        {
          reportId: 'report-1',
          userId: 'test-user-123',
          reportData: { propertyInformation: { address: '123 Test St' } },
          createdAt: '2023-01-01T00:00:00Z',
        },
        {
          reportId: 'report-2',
          userId: 'test-user-123',
          reportData: { propertyInformation: { address: '456 Test St' } },
          createdAt: '2023-01-02T00:00:00Z',
        },
      ];

      // Mock the query to return the reports, and also mock the requestRentalReport calls
      mockDynamoDBDocClient.send
        .mockResolvedValueOnce({ Items: mockReports }) // Query call
        .mockResolvedValueOnce({ Item: mockReports[0] }) // requestRentalReport for report-1
        .mockResolvedValueOnce({ Item: mockReports[1] }); // requestRentalReport for report-2

      const result = await handler(mockEvent as APIGatewayEvent, mockContext);

      expect(result.statusCode).toBe(200);
      // The lambda returns a map of reportId -> reportData
      const expectedMap = {
        'report-1': { propertyInformation: { address: '123 Test St' } },
        'report-2': { propertyInformation: { address: '456 Test St' } }
      };
      expect(result.body).toBe(JSON.stringify(expectedMap));
    });

    it('should return empty array when no reports found', async () => {
      mockDynamoDBDocClient.send.mockResolvedValue({ Items: [] });

      const result = await handler(mockEvent as APIGatewayEvent, mockContext);

      expect(result.statusCode).toBe(200);
      expect(result.body).toBe('{}');
    });
  });

  describe('saveRentalReport update action', () => {
    beforeEach(() => {
      mockEvent.body = JSON.stringify({
        action: 'saveRentalReport',
        reportId: 'report-123',
        userId: 'test-user-123',
        reportData: {
          propertyInformation: {
            address: '456 Updated St',
          },
        },
        savingExistingReport: true,
      });
    });

    it('should update rental report successfully', async () => {
      const existingReport = {
        reportId: 'report-123',
        userId: 'test-user-123',
        reportData: {},
      };

      mockDynamoDBDocClient.send
        .mockResolvedValueOnce({ Item: existingReport }) // Get existing report
        .mockResolvedValueOnce({}); // Update report

      const result = await handler(mockEvent as APIGatewayEvent, mockContext);

      expect(result.statusCode).toBe(200);
      expect(result.body).toBe('{"message":"Report updated"}');
    });

    it('should return 404 for non-existent report', async () => {
      mockDynamoDBDocClient.send.mockResolvedValue({ Item: undefined });

      const result = await handler(mockEvent as APIGatewayEvent, mockContext);

      expect(result.statusCode).toBe(404);
      expect(result.body).toBe('{"error":"Report not found"}');
    });
  });

  describe('deleteRentalReport action', () => {
    beforeEach(() => {
      mockEvent.body = JSON.stringify({
        action: 'deleteRentalReport',
        reportId: 'report-123',
        userId: 'test-user-123',
      });
    });

    it('should delete rental report successfully', async () => {
      const existingReport = {
        reportId: 'report-123',
        userId: 'test-user-123',
        reportData: {},
      };

      mockDynamoDBDocClient.send
        .mockResolvedValueOnce({ Item: existingReport }) // Get existing report
        .mockResolvedValueOnce({}); // Delete report

      const result = await handler(mockEvent as APIGatewayEvent, mockContext);

      expect(result.statusCode).toBe(200);
      expect(result.body).toBe('{"message":"Report deleted"}');
    });

    it('should return 404 for non-existent report', async () => {
      mockDynamoDBDocClient.send.mockResolvedValue({ Item: undefined });

      const result = await handler(mockEvent as APIGatewayEvent, mockContext);

      expect(result.statusCode).toBe(404);
      expect(result.body).toBe('{"error":"Report not found"}');
    });
  });

  describe('Error handling', () => {
    it('should handle invalid JSON', async () => {
      mockEvent.body = 'invalid json';

      const result = await handler(mockEvent as APIGatewayEvent, mockContext);

      expect(result.statusCode).toBe(400);
      expect(result.body).toBe('{"error":"Invalid JSON input"}');
    });

    it('should handle unsupported action', async () => {
      mockEvent.body = JSON.stringify({
        action: 'unsupported',
        userId: 'test-user-123',
      });

      const result = await handler(mockEvent as APIGatewayEvent, mockContext);

      expect(result.statusCode).toBe(400);
      expect(result.body).toBe('{"error":"Invalid action"}');
    });

    it('should handle database errors', async () => {
      mockDynamoDBDocClient.send.mockRejectedValue(new Error('Database error'));

      const result = await handler(mockEvent as APIGatewayEvent, mockContext);

      expect(result.statusCode).toBe(500);
      expect(result.body).toBe('{"error":"Internal Server Error"}');
    });

    it('should handle user config errors', async () => {
      const { getUserConfigs } = require('../../../src/lambdas/utils/lambdaUtils');
      getUserConfigs.mockRejectedValue(new Error('User config error'));

      const result = await handler(mockEvent as APIGatewayEvent, mockContext);

      expect(result.statusCode).toBe(500);
      expect(result.body).toBe('{"error":"Internal Server Error"}');
    });
  });
});