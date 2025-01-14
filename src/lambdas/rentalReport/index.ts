const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, GetCommand, PutCommand, DeleteCommand, UpdateCommand } = require('@aws-sdk/lib-dynamodb');
import { APIGatewayEvent } from 'aws-lambda';
import { createResponse } from '../utils/lambdaUtils';
import { IRentalCalculatorData } from '@bpenwell/instantlyanalyze-module';

const client = new DynamoDBClient();
const ddbDocClient = DynamoDBDocumentClient.from(client);
const TABLE_NAME = 'RentalPropertyReport';

exports.handler = async (event: APIGatewayEvent | any) => {
  const method = event.requestContext.http.method;
  // Handle preflight OPTIONS request
  if (method === 'OPTIONS') {
    // Respond with CORS headers and no body
    return createResponse(200, '');
  }

  const { action, reportId, userId = undefined, isSharable = false, reportData } = JSON.parse(event.body);

  switch (action) {
    case 'changeRentalReportSharability':
      return await changeRentalReportSharability(reportId, userId, isSharable);
    case 'getRentalReport':
      return await getRentalReport(reportId, userId);
    case 'saveRentalReport':
      return await saveRentalReport(reportId, userId, reportData);
    case 'deleteRentalReport':
      return await deleteRentalReport(reportId, userId);
    default:
      return createResponse(400, JSON.stringify({ error: 'Invalid action' }));
  }
};

const changeRentalReportSharability = async (reportId: string, userId: string, isSharable: boolean) => {
  try {
    const { Item } = await ddbDocClient.send(new GetCommand({
      TableName: TABLE_NAME,
      Key: {
        userId,
        reportId,
      },
    }));

    if (!Item) {
      return createResponse(404, JSON.stringify({ error: 'Report not found' }));
    }

    if (Item.userId !== userId) {
      return createResponse(200, JSON.stringify({ error: 'AccessDeniedException' }));
    }

    await ddbDocClient.send(new UpdateCommand({
      TableName: TABLE_NAME,
      Key: {
        userId,
        reportId,
      },
      UpdateExpression: 'set isSharable = :isSharable',
      ExpressionAttributeValues: {
        ':isSharable': isSharable,
      },
    }));

    return createResponse(200, JSON.stringify({ message: 'Sharability updated' }));
  } catch (error) {
    console.error(error);
    return createResponse(500, JSON.stringify({ error: 'Internal Server Error' }));
  }
};

const getRentalReport = async (reportId: string, userId: string) => {
  try {
    const { Item } = await ddbDocClient.send(new GetCommand({
      TableName: TABLE_NAME,
      Key: {
        userId,
        reportId,
      },
    }));

    if (!Item) {
      return createResponse(404, JSON.stringify({ error: 'Report not found' }));
    }

    if (Item.isSharable || Item.userId === userId) {
      return createResponse(200, JSON.stringify(Item));
    }

    return createResponse(200, JSON.stringify({ error: 'AccessDeniedException' }));
  } catch (error) {
    console.error(error);
    return createResponse(500, JSON.stringify({ error: 'Internal Server Error' }));
  }
};

const saveRentalReport = async (reportId: string, userId: string, reportData: IRentalCalculatorData) => {
  try {
    const { Item } = await ddbDocClient.send(new GetCommand({
      TableName: TABLE_NAME,
      Key: {
        userId,
        reportId,
      },
    }));

    if (Item) {
      if (Item.userId !== userId) {
        return createResponse(200, JSON.stringify({ error: 'AccessDeniedException' }));
      }

      await ddbDocClient.send(new UpdateCommand({
        TableName: TABLE_NAME,
        Key: {
          userId,
          reportId,
        },
        UpdateExpression: 'set reportData = :reportData',
        ExpressionAttributeValues: {
          ':reportData': reportData,
        },
      }));

      return createResponse(200, JSON.stringify({ message: 'Report updated' }));
    }

    await ddbDocClient.send(new PutCommand({
      TableName: TABLE_NAME,
      Item: {
        reportId,
        userId,
        reportData,
        isSharable: false,
      },
    }));

    return createResponse(200, JSON.stringify({ message: 'Report created' }));
  } catch (error) {
    console.error(error);
    return createResponse(500, JSON.stringify({ error: 'Internal Server Error' }));
  }
};

const deleteRentalReport = async (reportId: string, userId: string) => {
  try {
    const { Item } = await ddbDocClient.send(new GetCommand({
      TableName: TABLE_NAME,
      Key: { 
        userId,
        reportId
      },
    }));

    if (!Item) {
      return createResponse(404, JSON.stringify({ error: 'Report not found' }));
    }

    if (Item.userId !== userId) {
      return createResponse(200, JSON.stringify({ error: 'AccessDeniedException' }));
    }

    await ddbDocClient.send(new DeleteCommand({
      TableName: TABLE_NAME,
      Key: { 
        userId,
        reportId,
      },
    }));

    return createResponse(200, JSON.stringify({ message: 'Report deleted' }));
  } catch (error) {
    console.error(error);
    return createResponse(500, JSON.stringify({ error: 'Internal Server Error' }));
  }
};