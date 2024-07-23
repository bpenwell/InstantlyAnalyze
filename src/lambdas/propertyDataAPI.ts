import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
/*import { DynamoDB } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocument } from '@aws-sdk/lib-dynamodb';
const dynamo = DynamoDBDocument.from(new DynamoDB());*/

/**
 * Demonstrates a simple HTTP endpoint using API Gateway. You have full
 * access to the request and response payload, including headers and
 * status code.
 *
 * To scan a DynamoDB table, make a GET request with the TableName as a
 * query string parameter. To put, update, or delete an item, make a POST,
 * PUT, or DELETE request respectively, passing in the payload to the
 * DynamoDB API as a JSON body.
 */
export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    console.log('Received event:', JSON.stringify(event));

    let body;
    let statusCode = '200';
    const headers = {
        'Content-Type': 'application/json',
    };
    
    body='Hello World!';
    
    return {
        statusCode,
        body,
        headers,
    };
};
