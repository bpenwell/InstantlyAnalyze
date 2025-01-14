import { APIGatewayEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import { GetCommand, PutCommand } from '@aws-sdk/lib-dynamodb';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { createResponse } from '../utils/lambdaUtils';

interface IUserConfigs {
  userId: string;
  status: 'undefined' | 'free' | 'paid' | 'admin';
  freeReportsAvailable?: number;
}

const TABLE_NAME = 'UserConfigs';
const ddbClient = new DynamoDBClient({});

const getUserConfigs = async (userId: string): Promise<IUserConfigs | null> => {
  const getParams = {
    TableName: TABLE_NAME,
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

const createUserConfig = async (userId: string): Promise<IUserConfigs> => {
  const newUserConfig: IUserConfigs = {
    userId,
    status: 'free',
    freeReportsAvailable: 5,
  };

  const putParams = {
    TableName: TABLE_NAME,
    Item: newUserConfig,
  };

  const putCommand = new PutCommand(putParams);
  await ddbClient.send(putCommand);

  return newUserConfig;
};

/**
 * Lambda entry point
 */
export const handler = async (
  event: APIGatewayEvent | any, 
  context: Context
): Promise<APIGatewayProxyResult> => {
  const method = event.requestContext.http.method;
  // Handle preflight OPTIONS request
  if (method === 'OPTIONS') {
    console.log('Options request, sending headers');
    // Respond with CORS headers and no body
    return createResponse(200, '');
  }

  try {
    const path = event.rawPath;

    // Parse the request body
    const body = JSON.parse(event.body || '{}');
    const userId = body.userId;

    if (!userId) {
      console.log('Missing userId in request body');
      return createResponse(400, { message: 'Missing userId in request body.' });
    }

    console.log('User ID:', userId);

    // POST: /userConfigs/getUser
    if (path.includes('getUser')) {
      console.log('Fetching user configs');
      try {
        const userConfigs = await getUserConfigs(userId);
        return createResponse(200, userConfigs);
      }
      catch (error: any) {
        if (error.message === 'User not found') {
          return createResponse(200, {
            message: 'User not found',
          });
        }
        else {
          throw createResponse(500, error);
        }
      }
    }
    // POST: /userConfigs/createUser
    else if (path.includes('createUser')) {
      console.log('Creating user config');
      const newUserConfig = await createUserConfig(userId);
      console.log('New user config created:', newUserConfig);
      return createResponse(201, newUserConfig);
    }

    // Handle other routes if needed...
    console.log('Route not found');
    return createResponse(404, { message: 'Route not found.' });
  } catch (error: any) {
    console.error('Internal Server Error:', error);
    return createResponse(500, { message: 'Internal Server Error', error: error.message });
  }
};