const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, GetCommand, PutCommand, DeleteCommand, UpdateCommand } = require('@aws-sdk/lib-dynamodb');

const client = new DynamoDBClient();
const ddbDocClient = DynamoDBDocumentClient.from(client);
const TABLE_NAME = 'RentalReports';

exports.handler = async (event) => {
  const { action, reportId, userId, isSharable, reportData } = JSON.parse(event.body);

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
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Invalid action' }),
      };
  }
};

const changeRentalReportSharability = async (reportId, userId, isSharable) => {
  try {
    const { Item } = await ddbDocClient.send(new GetCommand({
      TableName: TABLE_NAME,
      Key: { reportId },
    }));

    if (!Item) {
      return { statusCode: 404, body: JSON.stringify({ error: 'Report not found' }) };
    }

    if (Item.userId !== userId) {
      return { statusCode: 200, body: JSON.stringify({ error: 'AccessDeniedException' }) };
    }

    await ddbDocClient.send(new UpdateCommand({
      TableName: TABLE_NAME,
      Key: { reportId },
      UpdateExpression: 'set isSharable = :isSharable',
      ExpressionAttributeValues: {
        ':isSharable': isSharable,
      },
    }));

    return { statusCode: 200, body: JSON.stringify({ message: 'Sharability updated' }) };
  } catch (error) {
    console.error(error);
    return { statusCode: 500, body: JSON.stringify({ error: 'Internal Server Error' }) };
  }
};

const getRentalReport = async (reportId, userId) => {
  try {
    const { Item } = await ddbDocClient.send(new GetCommand({
      TableName: TABLE_NAME,
      Key: { reportId },
    }));

    if (!Item) {
      return { statusCode: 404, body: JSON.stringify({ error: 'Report not found' }) };
    }

    if (Item.isSharable || Item.userId === userId) {
      return { statusCode: 200, body: JSON.stringify(Item) };
    }

    return { statusCode: 200, body: JSON.stringify({ error: 'AccessDeniedException' }) };
  } catch (error) {
    console.error(error);
    return { statusCode: 500, body: JSON.stringify({ error: 'Internal Server Error' }) };
  }
};

const saveRentalReport = async (reportId, userId, reportData) => {
  try {
    const { Item } = await ddbDocClient.send(new GetCommand({
      TableName: TABLE_NAME,
      Key: { reportId },
    }));

    if (Item) {
      if (Item.userId !== userId) {
        return { statusCode: 200, body: JSON.stringify({ error: 'AccessDeniedException' }) };
      }

      await ddbDocClient.send(new UpdateCommand({
        TableName: TABLE_NAME,
        Key: { reportId },
        UpdateExpression: 'set reportData = :reportData',
        ExpressionAttributeValues: {
          ':reportData': reportData,
        },
      }));

      return { statusCode: 200, body: JSON.stringify({ message: 'Report updated' }) };
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

    return { statusCode: 200, body: JSON.stringify({ message: 'Report created' }) };
  } catch (error) {
    console.error(error);
    return { statusCode: 500, body: JSON.stringify({ error: 'Internal Server Error' }) };
  }
};

const deleteRentalReport = async (reportId, userId) => {
  try {
    const { Item } = await ddbDocClient.send(new GetCommand({
      TableName: TABLE_NAME,
      Key: { reportId },
    }));

    if (!Item) {
      return { statusCode: 404, body: JSON.stringify({ error: 'Report not found' }) };
    }

    if (Item.userId !== userId) {
      return { statusCode: 200, body: JSON.stringify({ error: 'AccessDeniedException' }) };
    }

    await ddbDocClient.send(new DeleteCommand({
      TableName: TABLE_NAME,
      Key: { reportId },
    }));

    return { statusCode: 200, body: JSON.stringify({ message: 'Report deleted' }) };
  } catch (error) {
    console.error(error);
    return { statusCode: 500, body: JSON.stringify({ error: 'Internal Server Error' }) };
  }
};