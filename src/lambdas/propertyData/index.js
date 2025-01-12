/* global fetch */
import { DynamoDB } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocument } from '@aws-sdk/lib-dynamodb';
import { constructFullAddress, cacheApiResponse, checkAndUpdateApiUsage, getExpirationTime, getApiUsageCount, updateApiUsageCount } from '../utils/lambdaUtils';
import { API_USAGE_TABLE_NAME, RENTCAST_API_NAME } from '../utils/lambdaConstants';

const dynamo = DynamoDBDocument.from(new DynamoDB());
const PropertyDataTableName = 'PropertyData';
const KEY_NAME = 'address';

// Helper function to fetch data from the external property API
const fetchPropertyData = async (fullAddress) => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error('API key is missing in environment variables');
  }

  console.debug(`[fetchPropertyData]: encode=${encodeURIComponent(fullAddress)}`);
  const response = await fetch(`https://api.rentcast.io/v1/properties?address=${encodeURIComponent(fullAddress)}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'X-Api-Key': apiKey, // Add the API key to the headers
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch property data: ${response.status} ${response.statusText}`);
  }

  try {
    const data = await response.json();
    return data;
  } catch (error) {
    throw new Error('Failed to parse property data response');
  }
};

// Define CORS headers
const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*', // Update this to your frontend's origin
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  // 'Access-Control-Allow-Credentials': 'true', // Uncomment if you need to allow credentials
};

export const handler = async (event) => {
  let body;
  let statusCode = 200;

  // Initialize headers with CORS headers and Content-Type
  const headers = {
    ...CORS_HEADERS,
    'Content-Type': 'application/json',
  };

  try {
    const method = event.requestContext.http.method;
    console.log(`event=${method}`);
    console.log(`method=${method}`);

    // Handle preflight OPTIONS request
    if (method === 'OPTIONS') {
      console.log('Options request, sending headers');
      // Respond with CORS headers and no body
      return {
        statusCode: 200,
        headers: CORS_HEADERS,
        body: '', // No content needed for OPTIONS response
      };
    }

    // Handle CloudWatch scheduled reset event
    if (event.action === 'resetUsageCount') {
      await resetApiUsageCount(RENTCAST_API_NAME, API_USAGE_TABLE_NAME);
      body = JSON.stringify({ message: 'API usage count reset successfully.' });
    } else {
      // Parse the request body, which will contain the address data
      console.log('event:');
      console.log(event);
      const requestBody = JSON.parse(event.body || '{}');
      console.log(requestBody);

      const street = requestBody.streetAddress;
      const city = requestBody.city;
      const state = requestBody.state;
      const zip = requestBody.zipCode;

      if (!street || !city || !state || !zip) {
        throw new Error('Street, city, state, and zip parameters are required');
      }

      // Construct the full address string
      const fullAddress = constructFullAddress(street, city, state, zip);

      // Check if data for the address already exists in DynamoDB
      const getItemParams = {
        TableName: PropertyDataTableName,
        Key: { address: fullAddress },
      };

      const cachedData = await dynamo.get(getItemParams);
      console.debug(`cachedData`);
      console.debug(cachedData);
      if (cachedData.Item) {
        // If data exists in DynamoDB, return it
        body = JSON.stringify(cachedData.Item);
      } else {
        // Set the maximum allowed API calls per month
        const maxApiCallsPerMonth = parseInt(process.env.MAX_API_CALLS_PER_MONTH) || 48;
        console.log(`maxApiCallsPerMonth=${maxApiCallsPerMonth}`);

        // Atomically update the API usage count and ensure we do not exceed the limit
        try {
          await checkAndUpdateApiUsage(API_USAGE_TABLE_NAME, RENTCAST_API_NAME, 1, maxApiCallsPerMonth);
        } catch (error) {
          if (error.name === 'ConditionalCheckFailedException') {
            body = JSON.stringify({ error: 'API limit exceeded. Please try again later.' });
            return {
              statusCode: 429,
              headers,
              body,
            };
          } else {
            throw error;
          }
        }

        // If data doesn't exist, call the external API
        const propertyData = await fetchPropertyData(fullAddress);

        // Cache the API response in DynamoDB with an expiration date
        const item = await cacheApiResponse('PropertyData', KEY_NAME, fullAddress, propertyData);

        // Return the property data
        body = JSON.stringify(item);
      }
    }
  } catch (error) {
    statusCode = 400;
    body = JSON.stringify({ error: error.message });
  }

  return {
    statusCode,
    headers,
    body,
  };
};