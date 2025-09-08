import { DynamoDB, DynamoDBClient, ReturnValue } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocument, GetCommand, PutCommand } from '@aws-sdk/lib-dynamodb';
import { APIGatewayProxyResult } from 'aws-lambda';
import { addDays, formatISO } from 'date-fns';
import { USER_CONFIGS_TABLE_NAME } from './lambdaConstants';
import type { IUserConfigs } from '@bpenwell/instantlyanalyze-module';

const dynamo = DynamoDBDocument.from(new DynamoDB());

export const getExpirationTime = (days: number = 30): string => {
  const expirationTime = formatISO(addDays(new Date(), days));
  console.log(`Generated expiration time: ${expirationTime}`);
  return expirationTime;
};

export const getApiUsageCount = async (TableName: string, apiName: string): Promise<number> => {
  console.log(`Fetching API usage count for ${apiName} from table ${TableName}`);
  const params = {
    TableName,
    Key: { apiName },
  };
  const result = await dynamo.get(params);
  console.log(`DynamoDB get result: ${JSON.stringify(result)}`);

  if (result.Item?.count === undefined) {
    return 0;
  }
  return result.Item.count;
};

export const updateApiUsageCount = async (TableName: string, apiName: string, incrementBy: number, maxApiCallsPerMonth: number): Promise<void> => {
  console.log(`Updating API usage count for ${apiName} in table ${TableName}`);
  const params = {
    TableName,
    Key: { apiName },
    UpdateExpression: 'ADD #count :incrementBy',
    ConditionExpression: '#count < :maxLimit',
    ExpressionAttributeNames: {
      '#count': 'count',
    },
    ExpressionAttributeValues: {
      ':incrementBy': incrementBy,
      ':maxLimit': maxApiCallsPerMonth,
    },
    ReturnValues: ReturnValue.UPDATED_NEW,
  };
  console.log(`Update params: ${JSON.stringify(params)}`);
  await dynamo.update(params);
  console.log(`API usage count updated for ${apiName}`);
};

export const cacheApiResponse = async (TableName: string, KEY_NAME: string, keyValue: string, propertyData: any): Promise<any> => {
  const expirationDate = getExpirationTime();
  const item = {
    [KEY_NAME]: keyValue,
    propertyData,
    timestamp: formatISO(new Date()),
    expirationDate,
  };
  const putItemParams = {
    TableName,
    Item: item,
  };
  console.log(`Caching API response with params: ${JSON.stringify(putItemParams)}`);
  await dynamo.put(putItemParams);
  console.log(`API response cached for key ${keyValue}`);
  return item;
};

export const checkAndUpdateApiUsage = async (TableName: string, apiName: string, incrementBy: number, maxApiCallsPerMonth: number): Promise<void> => {
  console.log(`Checking and updating API usage for ${apiName}`);
  const currentCallsThisMonth = await getApiUsageCount(TableName, apiName);
  if (currentCallsThisMonth + incrementBy > maxApiCallsPerMonth) {
    throw new Error(`API limit for data source ${apiName} exceeded. Use "Contact Us" page to have website owner fix the issue.`);
  }
  const params = {
    TableName,
    Key: { apiName },
    UpdateExpression: 'SET #count = if_not_exists(#count, :start) + :inc',
    ExpressionAttributeNames: {
      '#count': 'count',
    },
    ExpressionAttributeValues: {
      ':start': 0,
      ':inc': incrementBy,
    },
    ReturnValues: 'UPDATED_NEW' as ReturnValue,
  };
  await dynamo.update(params);
  console.log(`API usage count updated for ${apiName}`);
};

// Helper function to reset API usage count at the beginning of each month
export const resetApiUsageCount = async (api: string, tableName: string) => {
  console.log(`Resetting API usage count for ${api} in table ${tableName}`);
  const params = {
    TableName: tableName,
    Key: { apiName: api },
    UpdateExpression: 'SET #count = :value',
    ExpressionAttributeNames: {
      '#count': 'count',
    },
    ExpressionAttributeValues: {
      ':value': 0,
    },
  };
  console.log(`Reset params: ${JSON.stringify(params)}`);
  await dynamo.update(params);
  console.log(`API usage count reset for ${api}`);
};

// Helper function to construct full address from individual components
export const constructFullAddress = (street: string, city: string, state: string, zip: string): string => {
  const fullAddress = `${street}, ${city}, ${state}, ${zip}`;
  console.log(`Constructed full address: ${fullAddress}`);
  return fullAddress;
};

export const getHeaders = () => {
  return {
    'Access-Control-Allow-Origin': '*', // Or specify your actual domain
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Content-Type': 'application/json',
    // 'Access-Control-Allow-Credentials': 'true', // Uncomment if needed
  };
};

/**
 * Utility: Create an HTTP response
 */
export const createResponse = (statusCode: number, body: any, stringifyBody: boolean = false): APIGatewayProxyResult => {
  if (stringifyBody) {
    body = JSON.stringify(body);
  }
  const reponse = {
    statusCode,
    body: body,
    headers: getHeaders(),
  };
  console.log('Returning ', reponse);
  return reponse;
}

export const getUserConfigs = async (ddbClient: any, userId: string): Promise<IUserConfigs | null> => {
  const getParams = {
    TableName: USER_CONFIGS_TABLE_NAME,
    Key: { userId },
  };

  const getCommand = new GetCommand(getParams);
  const { Item } = await ddbClient.send(getCommand);

  if (Item) {
    return Item as IUserConfigs;
  } else {
    throw new Error('User not found');
  }
};

export const updateUserConfigs = async (ddbClient: DynamoDBClient, newUserConfig: IUserConfigs): Promise<boolean | null> => {
  const putParams = {
    TableName: USER_CONFIGS_TABLE_NAME,
    Item: newUserConfig,
  };
  
  const putCommand = new PutCommand(putParams);
  await ddbClient.send(putCommand);
  return true;
};