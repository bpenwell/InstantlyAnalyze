import { DynamoDBClient, DynamoDB } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, DynamoDBDocument, GetCommand, PutCommand, UpdateCommand, ScanCommand } from '@aws-sdk/lib-dynamodb';

// Mock AWS SDK
jest.mock('@aws-sdk/client-dynamodb');
jest.mock('@aws-sdk/lib-dynamodb');

const mockDynamoDBClient = { send: jest.fn() };
const mockDynamoDBDocClient = { 
  send: jest.fn(),
  get: jest.fn(),
  put: jest.fn(),
  update: jest.fn()
};

(DynamoDBClient as jest.Mock).mockImplementation(() => mockDynamoDBClient);
(DynamoDB as jest.Mock).mockImplementation(() => mockDynamoDBClient);
(DynamoDBDocumentClient.from as jest.Mock).mockReturnValue(mockDynamoDBDocClient);
(DynamoDBDocument.from as jest.Mock).mockReturnValue(mockDynamoDBDocClient);

const {
  createResponse,
  constructFullAddress,
  cacheApiResponse,
  checkAndUpdateApiUsage,
  resetApiUsageCount,
  getUserConfigs,
  updateUserConfigs,
} = require('../../../src/lambdas/utils/lambdaUtils');

describe('Lambda Utils', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createResponse', () => {
    it('should create response with correct structure', () => {
      const result = createResponse(200, { message: 'success' }, false);

      expect(result).toEqual({
        statusCode: 200,
        body: '{"message":"success"}',
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Content-Type': 'application/json',
        },
      });
    });

    it('should handle base64 encoded responses', () => {
      const result = createResponse(200, 'base64data', true);

      expect(result).toEqual({
        statusCode: 200,
        body: 'base64data',
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Content-Type': 'application/json',
        },
      });
    });
  });

  describe('constructFullAddress', () => {
    it('should construct full address from components', () => {
      const result = constructFullAddress('123 Main St', 'Anytown', 'CA', '12345');

      expect(result).toBe('123 Main St, Anytown, CA, 12345');
    });

    it('should handle missing components', () => {
      const result = constructFullAddress('123 Main St', 'Anytown', '', '');

      expect(result).toBe('123 Main St, Anytown, , ');
    });

    it('should handle empty strings', () => {
      const result = constructFullAddress('', '', '', '');

      expect(result).toBe(', , , ');
    });
  });

  describe('cacheApiResponse', () => {
    it('should cache API response successfully', async () => {
      const mockResponse = { data: 'cached data' };
      mockDynamoDBDocClient.put.mockResolvedValue({ Item: mockResponse });

      const result = await cacheApiResponse('TestTable', 'keyValue', 'test-key', mockResponse);

      expect(result).toEqual(expect.objectContaining({
        keyValue: 'test-key',
        propertyData: mockResponse,
        timestamp: expect.any(String),
        expirationDate: expect.any(String),
      }));
      expect(mockDynamoDBDocClient.put).toHaveBeenCalledWith(
        expect.objectContaining({
          TableName: 'TestTable',
          Item: expect.objectContaining({
            keyValue: 'test-key',
            propertyData: mockResponse,
          }),
        })
      );
    });

    it('should handle caching errors', async () => {
      mockDynamoDBDocClient.put.mockRejectedValue(new Error('Cache error'));

      await expect(cacheApiResponse('TestTable', 'keyValue', 'test-key', {})).rejects.toThrow('Cache error');
    });
  });

  describe('checkAndUpdateApiUsage', () => {
    it('should check and update API usage successfully', async () => {
      mockDynamoDBDocClient.get
        .mockResolvedValueOnce({ Item: { count: 5 } }); // getApiUsageCount
      mockDynamoDBDocClient.update
        .mockResolvedValueOnce({}); // updateApiUsageCount

      await checkAndUpdateApiUsage('TestTable', 'test-api', 1, 1000);

      expect(mockDynamoDBDocClient.update).toHaveBeenCalledWith(
        expect.objectContaining({
          TableName: 'TestTable',
          Key: { apiName: 'test-api' },
          UpdateExpression: 'SET #count = if_not_exists(#count, :start) + :inc',
          ExpressionAttributeNames: { '#count': 'count' },
          ExpressionAttributeValues: {
            ':start': 0,
            ':inc': 1,
          },
        })
      );
    });

    it('should handle API usage update errors', async () => {
      mockDynamoDBDocClient.get
        .mockResolvedValueOnce({ Item: { count: 5 } }); // getApiUsageCount
      mockDynamoDBDocClient.update
        .mockRejectedValueOnce(new Error('Update error')); // updateApiUsageCount

      await expect(checkAndUpdateApiUsage('TestTable', 'test-api', 1, 1000)).rejects.toThrow('Update error');
    });
  });

  describe('resetApiUsageCount', () => {
    it('should reset API usage count successfully', async () => {
      mockDynamoDBDocClient.update.mockResolvedValue({});

      await resetApiUsageCount('test-api', 'TestTable');

      expect(mockDynamoDBDocClient.update).toHaveBeenCalledWith(
        expect.objectContaining({
          TableName: 'TestTable',
          Key: { apiName: 'test-api' },
          UpdateExpression: 'SET #count = :value',
          ExpressionAttributeNames: { '#count': 'count' },
          ExpressionAttributeValues: { ':value': 0 },
        })
      );
    });

    it('should handle reset errors', async () => {
      mockDynamoDBDocClient.update.mockRejectedValue(new Error('Reset error'));

      await expect(resetApiUsageCount('test-api', 'TestTable')).rejects.toThrow('Reset error');
    });
  });

  describe('getUserConfigs', () => {
    it('should get user configurations successfully', async () => {
      const mockUserConfig = {
        userId: 'test-user-123',
        subscription: { status: 'pro' },
        freeReportsAvailable: 5,
        preferences: {},
      };

      mockDynamoDBDocClient.send.mockClear();
      mockDynamoDBDocClient.send.mockResolvedValue({ Item: mockUserConfig });

      const result = await getUserConfigs(mockDynamoDBDocClient, 'test-user-123');

      expect(result).toEqual(mockUserConfig);
      expect(mockDynamoDBDocClient.send).toHaveBeenCalledTimes(1);
      expect(mockDynamoDBDocClient.send).toHaveBeenCalledWith(expect.any(Object));
    });

    it('should throw error when user not found', async () => {
      mockDynamoDBDocClient.send.mockClear();
      mockDynamoDBDocClient.send.mockResolvedValue({ Item: undefined });

      await expect(getUserConfigs(mockDynamoDBDocClient, 'nonexistent-user')).rejects.toThrow('User not found');
    });

    it('should handle database errors', async () => {
      mockDynamoDBDocClient.send.mockClear();
      mockDynamoDBDocClient.send.mockRejectedValue(new Error('Database error'));

      await expect(getUserConfigs(mockDynamoDBDocClient, 'test-user-123')).rejects.toThrow('Database error');
    });
  });

  describe('updateUserConfigs', () => {
    it('should update user configurations successfully', async () => {
      const mockUserConfig = {
        userId: 'test-user-123',
        subscription: { status: 'pro' },
        freeReportsAvailable: 3,
        preferences: {},
      };

      mockDynamoDBDocClient.send.mockClear();
      mockDynamoDBDocClient.send.mockResolvedValue({});

      const result = await updateUserConfigs(mockDynamoDBDocClient, mockUserConfig);

      expect(result).toBe(true);
      expect(mockDynamoDBDocClient.send).toHaveBeenCalledTimes(1);
      expect(mockDynamoDBDocClient.send).toHaveBeenCalledWith(expect.any(Object));
    });

    it('should handle update errors', async () => {
      const mockUserConfig = {
        userId: 'test-user-123',
        subscription: { status: 'pro' },
      };

      mockDynamoDBDocClient.send.mockClear();
      mockDynamoDBDocClient.send.mockRejectedValue(new Error('Update error'));

      await expect(updateUserConfigs(mockDynamoDBDocClient, mockUserConfig)).rejects.toThrow('Update error');
    });
  });

});