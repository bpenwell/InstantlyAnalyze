import { APIGatewayEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import { PutCommand } from '@aws-sdk/lib-dynamodb';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { createResponse, getUserConfigs, updateUserConfigs } from '../utils/lambdaUtils';
import { defaultRentalInputs, IUserConfigs, UserStatus } from '@bpenwell/instantlyanalyze-module';
import { USER_CONFIGS_TABLE_NAME } from '../utils/lambdaConstants';

const ddbClient = new DynamoDBClient({});

const createUserConfig = async (userId: string): Promise<IUserConfigs> => {
  const newUserConfig: IUserConfigs = {
    userId,
    status: UserStatus.FREE,
    freeReportsAvailable: 5,
    preferences: {
      tablePageSize: 10,
      defaultRentalInputs: defaultRentalInputs,
    },
  };

  const putParams = {
    TableName: USER_CONFIGS_TABLE_NAME,
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
  console.log('event: ' + event);
  console.log('method: ' + method);
  // Handle preflight OPTIONS request
  if (method === 'OPTIONS') {
    console.log('Options request, sending headers');
    // Respond with CORS headers and no body
    return createResponse(200, '', true);
  }

  try {
    const path = event.rawPath;

    // Parse the request body
    const body = JSON.parse(event.body || '{}');
    const userId = body.userId;

    if (!userId) {
      console.log('Missing userId in request body');
      return createResponse(400, { message: 'Missing userId in request body.' }, true);
    }

    console.log('User ID:', userId);

    // POST: /userConfigs/getUser
    if (path.includes('getUser')) {
      console.log('Fetching user configs');
      try {
        const userConfigs = await getUserConfigs(ddbClient, userId);
        return createResponse(200, userConfigs, true);
      }
      catch (error: any) {
        if (error.message === 'User not found') {
          return createResponse(200, {
            message: 'User not found',
          }, true);
        }
        else {
          throw createResponse(500, error, true);
        }
      }
    }
    if (path.includes('getUser')) {
      console.log('Fetching user configs');
      try {
        const userConfigs = await getUserConfigs(ddbClient, userId);
        return createResponse(200, userConfigs, true);
      }
      catch (error: any) {
        if (error.message === 'User not found') {
          return createResponse(200, {
            message: 'User not found',
          }, true);
        }
        else {
          throw createResponse(500, error, true);
        }
      }
    } else if (path.includes('updateUser')) {
      const newUserConfig = body.newUserConfig as IUserConfigs;
      if (newUserConfig === undefined) {
        return createResponse(400, { message: 'Missing newUserConfig in request body.' }, true);
      }
      console.log(`Updating user config for ${userId} with ${JSON.stringify(newUserConfig)}`);
      try {
        await updateUserConfigs(ddbClient, newUserConfig);

        const userConfigs = await getUserConfigs(ddbClient, userId);
        return createResponse(200, userConfigs, true);
      }
      catch (error: any) {
        if (error.message === 'User not found') {
          return createResponse(200, {
            message: 'User not found',
          }, true);
        }
        else {
          throw createResponse(500, error, true);
        }
      }
    } else if (path.includes('createUser')) {
      console.log('Creating user config');
      const newUserConfig = await createUserConfig(userId);
      console.log('New user config created:', newUserConfig);
      return createResponse(201, newUserConfig, true);
    }

    // Handle other routes if needed...
    console.log('Route not found');
    return createResponse(404, { message: 'Route not found.' }, true);
  } catch (error: any) {
    console.error('Internal Server Error:', error);
    return createResponse(500, { message: 'Internal Server Error', error: error.message }, true);
  }
};