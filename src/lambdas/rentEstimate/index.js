/* global fetch */
import { DynamoDB } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocument } from '@aws-sdk/lib-dynamodb';

const dynamo = DynamoDBDocument.from(new DynamoDB());
const API_NAME = 'rentcast';

// Helper function to fetch estimated rent from the external API
const fetchEstimatedRent = async (address, propertyType = 'Single Family', bedrooms, bathrooms, squareFootage) => {
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

    // Fetch the estimated rent data
    const estimatedRent = await fetchEstimatedRent(fullAddress, propertyType, bedrooms, bathrooms, squareFootage);

    // Return the estimated rent data
    body = JSON.stringify(estimatedRent);
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