import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { SES } from 'aws-sdk';

// Initialize the AWS SES client
const ses = new SES({ region: process.env.AWS_REGION || 'us-east-2' });

// Configure your business email and the "from" email address
// (Make sure both addresses are verified in your SES configuration)
const BUSINESS_EMAIL = process.env.BUSINESS_EMAIL || 'business@example.com';
const FROM_EMAIL = process.env.FROM_EMAIL || 'no-reply@example.com';

export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    if (event.httpMethod !== 'POST') {
      return {
        statusCode: 405,
        body: JSON.stringify({ message: 'Method Not Allowed' }),
      };
    }

    // Parse the request body
    const { feedbackType, email, note } = JSON.parse(event.body || '{}');

    if (!feedbackType || !note) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          message: 'Missing required fields: feedbackType or note',
        }),
      };
    }

    // Build the email subject/content
    const subject = `New Feedback: ${feedbackType}`;
    const textBody = `
Feedback Type: ${feedbackType}
User Email: ${email || '(not provided)'}
----------------------------------------
${note}
`;

    // Construct params for SES
    const params: SES.SendEmailRequest = {
      Source: FROM_EMAIL,
      Destination: {
        ToAddresses: [BUSINESS_EMAIL],
      },
      Message: {
        Subject: { Data: subject },
        Body: {
          Text: { Data: textBody },
        },
      },
    };

    // Attempt to send via AWS SES
    await ses.sendEmail(params).promise();

    // Return success to the client
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
