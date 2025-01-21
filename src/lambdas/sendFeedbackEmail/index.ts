import { APIGatewayEvent, APIGatewayProxyResult } from 'aws-lambda';
import { SESClient, SendEmailCommand, SendEmailRequest } from '@aws-sdk/client-ses';
import { createResponse } from '../utils/lambdaUtils';

// Initialize the AWS SES client
const sesClient = new SESClient({ region: process.env.AWS_REGION || 'us-east-2' });

// Configure your email
const BUSINESS_EMAIL = 'ben@instantlyanalyze.com';

export const handler = async (
  event: APIGatewayEvent | any
): Promise<APIGatewayProxyResult> => {
  try {
    // Log the incoming event
    console.log('Received event:', JSON.stringify(event, null, 2));
  
    // Extract the HTTP method from the event
    const method = event.requestContext?.http?.method;
    console.log(`HTTP method: ${method}`);
  
    // Handle preflight OPTIONS request
    if (method === 'OPTIONS') {
      console.log('Preflight OPTIONS request received. Returning 200 with CORS headers.');
      return createResponse(200, '');
    }
    if (method !== 'POST') {
      return {
        statusCode: 405,
        body: JSON.stringify({ message: 'Method Not Allowed' }),
      };
    }

    // Parse the request body
    const { feedbackType, email, note, userFullName } = JSON.parse(event.body || '{}');
    if (!feedbackType || !note || !userFullName) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          message: 'Missing required fields: feedbackType, note, or userFullName',
        }),
      };
    }

    // Build the email subject/content
    const subject = `[InstantlyAnalyze][User ${feedbackType} Feedback]: User: ${userFullName}`;
    const textBody = note;
    

    // Construct params for SES
    const params: SendEmailRequest = {
      Source: BUSINESS_EMAIL, // Sending email (must be verified)
      Destination: {
        ToAddresses: [BUSINESS_EMAIL], // Receiving email (can be the same)
      },
      Message: {
        Subject: { Data: subject },
        Body: {
          Text: { Data: textBody },
        },
      },
    };

    // Send email via AWS SES
    await sesClient.send(new SendEmailCommand(params));

    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'Feedback email sent successfully' }),
    };
  } catch (error) {
    console.error('sendFeedbackEmail Lambda error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Error sending feedback email' }),
    };
  }
};
