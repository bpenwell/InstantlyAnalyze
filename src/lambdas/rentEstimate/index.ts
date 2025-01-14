/* global fetch */
import { DynamoDB } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocument } from '@aws-sdk/lib-dynamodb';
import { cacheApiResponse, checkAndUpdateApiUsage, resetApiUsageCount } from '../utils/lambdaUtils';
import { API_USAGE_TABLE_NAME, RENTCAST_API_NAME } from '../utils/lambdaConstants';
import { createResponse } from '../utils/lambdaUtils';
import { APIGatewayEvent } from 'aws-lambda';

const dynamo = DynamoDBDocument.from(new DynamoDB());
const PropertyRentEstimatesTableName = 'PropertyRentEstimates';
const KEY_NAME = 'rentEstimateKey';

// Helper function to fetch estimated rent from the external API
const fetchEstimatedRent = async (address: string, propertyType: string = 'Single Family', bedrooms: number, bathrooms: number, squareFootage: number) => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error('API key is missing in environment variables');
  }

  const url = `https://api.rentcast.io/v1/avm/rent/long-term?address=${encodeURIComponent(address)}&propertyType=${encodeURIComponent(propertyType)}&bedrooms=${bedrooms}&bathrooms=${bathrooms}&squareFootage=${squareFootage}`;
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'X-Api-Key': apiKey,
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch estimated rent: ${response.status} ${response.statusText}`);
  }

  try {
    const data = await response.json();
    return data;
  } catch (error) {
    throw new Error('Failed to parse estimated rent response');
  }
};

export const handler = async (event: APIGatewayEvent | any) => {
  let body;
  let statusCode = 200;

  try {
    const method = event.requestContext.http.method;
    // Handle preflight OPTIONS request
    if (method === 'OPTIONS') {
      return createResponse(200, '');
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
      const propertyType = requestBody.propertyType || 'Single Family';
      const bedrooms = requestBody.bedrooms;
      const bathrooms = requestBody.bathrooms;
      const squareFootage = requestBody.squareFootage;

      if (!street || !city || !state || !zip || !propertyType || !bedrooms || !bathrooms || !squareFootage) {
        throw new Error('Street, city, state, zip, propertyType, bedrooms, bathrooms, and squareFootage parameters are required');
      }

      // Construct the full address string
      const fullAddress = `${street}, ${city}, ${state}, ${zip}`;
      const key = `${street}-${city}-${state}-${propertyType}-${bedrooms}-${bathrooms}-${squareFootage}`;

      // Check if data for the address already exists in DynamoDB
      const getItemParams = {
        TableName: PropertyRentEstimatesTableName,
        Key: { rentEstimateKey: key },
      };

      const cachedData = await dynamo.get(getItemParams);
      console.debug(`cachedData`);
      console.debug(cachedData);
      if (cachedData.Item) {
        // If data exists in DynamoDB, return it
        body = JSON.stringify(cachedData.Item);
      } else {
        const maxApiCallsPerMonth = parseInt(process.env.MAX_API_CALLS_PER_MONTH!) || 48;
        console.log(`maxApiCallsPerMonth=${maxApiCallsPerMonth}`);

        // Atomically update the API usage count and ensure we do not exceed the limit
        try {
          await checkAndUpdateApiUsage(API_USAGE_TABLE_NAME, RENTCAST_API_NAME, 1, maxApiCallsPerMonth);
        } catch (error: any) {
          if (error.name === 'ConditionalCheckFailedException') {
            body = JSON.stringify({ error, message: 'API limit exceeded. Please try again later.' });
            return createResponse(429, body);
          } else {
            throw error;
          }
        }

        // If data doesn't exist, call the external API
        const estimatedRent = await fetchEstimatedRent(fullAddress, propertyType, bedrooms, bathrooms, squareFootage);

        // Cache the API response in DynamoDB with an expiration date
        const item = await cacheApiResponse(PropertyRentEstimatesTableName, KEY_NAME, key, estimatedRent);

        // Return the property data
        body = JSON.stringify(item);
      }
    }
  } catch (error: any) {
    statusCode = 400;
    body = JSON.stringify({ error: error.message });
  }

  return createResponse(statusCode, body);
};