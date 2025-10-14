import { APIGatewayEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import { PutCommand } from '@aws-sdk/lib-dynamodb';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { createResponse, getUserConfigs, updateUserConfigs, deleteUserConfigs, createUserConfig } from '../utils/lambdaUtils';
import { defaultRentalInputs, UserStatus } from '@bpenwell/instantlyanalyze-module';
import type { IUserConfigs } from '@bpenwell/instantlyanalyze-module';
import { USER_CONFIGS_TABLE_NAME } from '../utils/lambdaConstants';

const ddbClient = new DynamoDBClient({});


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
    
    // For GET requests, get userId from pathParameters, otherwise from body
    let userId: string;
    if (method === 'GET') {
      userId = event.pathParameters?.userId;
      if (!userId) {
        console.log('Missing userId in path parameters');
        return createResponse(400, { message: 'User ID is required' }, true);
      }
    } else {
      userId = body.userId;
      if (!userId) {
        console.log('Missing userId in request body');
        return createResponse(400, { message: 'Missing userId in request body.' }, true);
      }
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
          return createResponse(500, {
            message: 'Internal Server Error',
            error: error.message,
          }, true);
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
          return createResponse(500, {
            message: 'Internal Server Error',
            error: error.message,
          }, true);
        }
      }
    } else if (path.includes('deleteUser')) {
      console.log('Deleting user configs');
      try {
        await deleteUserConfigs(ddbClient, userId);
        return createResponse(200, { message: 'User deleted successfully' }, true);
      }
      catch (error: any) {
        if (error.message === 'User not found') {
          return createResponse(200, {
            message: 'User not found',
          }, true);
        }
        else {
          return createResponse(500, {
            message: 'Internal Server Error',
            error: error.message,
          }, true);
        }
      }
    } else if (path.includes('createUser')) {
      console.log('Creating user config');
      try {
        const newUserConfig = await createUserConfig(ddbClient, userId);
        console.log('New user config created:', newUserConfig);
        return createResponse(201, newUserConfig, true);
      }
      catch (error: any) {
        return createResponse(500, {
          message: 'Internal Server Error',
          error: error.message,
        }, true);
      }
    }

    // Handle other routes if needed...
    console.log('Route not found');
    return createResponse(404, { message: 'Route not found.' }, true);
  } catch (error: any) {
    console.error('Internal Server Error:', error);
    return createResponse(500, { message: 'Internal Server Error', error: error.message }, true);
  }
};