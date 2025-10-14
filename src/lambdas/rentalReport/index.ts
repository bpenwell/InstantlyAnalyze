import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
  DeleteCommand,
  UpdateCommand,
  QueryCommand,
} from '@aws-sdk/lib-dynamodb';
import { APIGatewayEvent } from 'aws-lambda';
import { createResponse, getUserConfigs, updateUserConfigs } from '../utils/lambdaUtils';
import type { IRentalCalculatorData } from '@bpenwell/instantlyanalyze-module';
import { UserStatus } from '@bpenwell/instantlyanalyze-module';
import type { IRentalReportDatabaseEntry } from '@bpenwell/instantlyanalyze-module';
import { USER_ID_INDEX } from '../utils/lambdaConstants';

const client = new DynamoDBClient();
const ddbDocClient = DynamoDBDocumentClient.from(client);
const TABLE_NAME = 'RentalPropertyReport';

exports.handler = async (event: APIGatewayEvent | any) => {
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

  // Parse the body
  let bodyJson;
  try {
    bodyJson = JSON.parse(event.body);
  } catch (err) {
    console.error('Failed to parse JSON body:', err);
    return createResponse(400, { error: 'Invalid JSON input' });
  }

  const { action, reportId, userId = undefined, reportData, savingExistingReport = false } = bodyJson;
  console.log(`Action: ${action}, ReportID: ${reportId}, UserID: ${userId}`);

  // Validate required parameters for saveRentalReport
  if (action === 'saveRentalReport') {
    if (!userId) {
      console.warn('Missing userId in saveRentalReport request');
      return createResponse(400, { error: 'Missing userId' });
    }
    if (!reportData) {
      console.warn('Missing reportData in saveRentalReport request');
      return createResponse(400, { error: 'Missing reportData' });
    }
  }

  // Convert the reportData to the correct type
  const typedReportData: IRentalCalculatorData = reportData as IRentalCalculatorData;

  switch (action) {
    case 'changeRentalReportSharability':
      return await changeRentalReportSharability(reportId, userId, typedReportData);
    case 'getRentalReport':
      return await getRentalReport(reportId, userId);
    case 'saveRentalReport':
      return await saveRentalReport(reportId, userId, typedReportData, savingExistingReport);
    case 'deleteRentalReport':
      return await deleteRentalReport(reportId, userId);
    case 'getAllRentalReports':
      return await getAllRentalReports(userId);
    default:
      console.warn(`Invalid action received: ${action}`);
      return createResponse(400, { error: 'Invalid action' });
  }
};

const changeRentalReportSharability = async (
  reportId: string,
  userId: string,
  reportData: IRentalCalculatorData
) => {
  console.log('changeRentalReportSharability called with:', {
    reportId,
    userId,
    'reportData.isShareable': reportData?.isShareable,
  });

  try {
    console.log(`Fetching item from DynamoDB for reportId: ${reportId}`);
    const { Item } = await ddbDocClient.send(
      new GetCommand({
        TableName: TABLE_NAME,
        Key: {
          reportId,
        },
      })
    );

    const typedItem = Item as IRentalReportDatabaseEntry;
    if (!typedItem) {
      console.log(`Report not found with reportId: ${reportId}`);
      return createResponse(404, { error: 'Report not found' });
    }

    if (typedItem.userId !== userId) {
      console.warn(
        `User mismatch. Found userId: ${typedItem.userId}, Request userId: ${userId}`
      );
      return createResponse(403, { error: 'AccessDeniedException' });
    }

    console.log('Updating report sharability...');
    await ddbDocClient.send(
      new UpdateCommand({
        TableName: TABLE_NAME,
        Key: {
          reportId,
        },
        UpdateExpression: 'set reportData = :reportData',
        ExpressionAttributeValues: {
          ':reportData': reportData,
        },
      })
    );

    console.log('Sharability updated successfully.');
    return createResponse(200, { message: 'Sharability updated' });
  } catch (error) {
    console.error('Error in changeRentalReportSharability:', error);
    return createResponse(500, { error: 'Internal Server Error' });
  }
};

const requestRentalReport = async (reportId: string): Promise<IRentalReportDatabaseEntry> => {
  const { Item } = await ddbDocClient.send(
    new GetCommand({
      TableName: TABLE_NAME,
      Key: {
        reportId,
      },
    })
  );

  return Item as IRentalReportDatabaseEntry;
};

const getRentalReport = async (reportId: string, userId: string) => {
  console.log('getRentalReport called with:', { reportId, userId });

  try {
    console.log(`Fetching report with reportId: ${reportId}`);
    const entry = await requestRentalReport(reportId);

    if (!entry) {
      console.log(`Report not found with reportId: ${reportId}`);
      return createResponse(404, { error: 'Report not found' });
    }

    console.log('Checking if user can access or if report is shareable...');
    if (entry.reportData.isShareable || entry.userId === userId) {
      console.log('User can access this report. Returning report data...');
      return createResponse(200, entry);
    }

    console.warn(
      `Access denied. Report is not shareable and userId does not match. userId: ${userId}`
    );
    return createResponse(403, { error: 'AccessDeniedException' });
  } catch (error) {
    console.error('Error in getRentalReport:', error);
    return createResponse(500, { error: 'Internal Server Error' });
  }
};

const saveRentalReport = async (
  reportId: string,
  userId: string,
  reportData: IRentalCalculatorData,
  savingExistingReport: boolean
) => {
  console.log('saveRentalReport called with:', {
    reportId,
    userId,
    'reportData.isShareable': reportData?.isShareable,
  });

  try {
    console.log(`Checking if report already exists with reportId: ${reportId}`);
    const { Item } = await ddbDocClient.send(
      new GetCommand({
        TableName: TABLE_NAME,
        Key: {
          reportId,
        },
      })
    );

    const typedItem = Item as IRentalReportDatabaseEntry;
    if (typedItem) {
      if (typedItem.userId !== userId) {
        console.warn(
          `User mismatch when updating. Found userId: ${typedItem.userId}, Request userId: ${userId}`
        );
        return createResponse(403, { error: 'AccessDeniedException' });
      }

      console.log('Updating existing report...');
      await ddbDocClient.send(
        new UpdateCommand({
          TableName: TABLE_NAME,
          Key: {
            reportId,
          },
          UpdateExpression: 'set reportData = :reportData',
          ExpressionAttributeValues: {
            ':reportData': reportData,
          },
        })
      );

      console.log('Report updated successfully.');
      return createResponse(200, { message: 'Report updated' });
    }
    else {
      // If we're trying to update an existing report but it doesn't exist, return 404
      if (savingExistingReport) {
        console.log(`Report not found with reportId: ${reportId} for update`);
        return createResponse(404, { error: 'Report not found' });
      }
      
      console.log('Report does not exist. Creating new report...');
      const userConfigs = await getUserConfigs(ddbDocClient, userId);

      if (userConfigs?.subscription.status === 'free') {
        if (!userConfigs?.freeReportsAvailable || userConfigs?.freeReportsAvailable <= 0) {
          console.warn(`No free reports available for userId: ${userId}`);
          return createResponse(200, { error: 'NoFreeReportsLeftException' });
        }
        else if (userConfigs?.freeReportsAvailable > 0 && !savingExistingReport) {
          updateUserConfigs(ddbDocClient, {
            ...userConfigs,
            freeReportsAvailable: userConfigs.freeReportsAvailable - 1,
          })
        }
      }
      
      await ddbDocClient.send(
        new PutCommand({
          TableName: TABLE_NAME,
          Item: {
            reportId,
            userId,
            reportData,
          },
        })
      );

      console.log('Report created successfully.');
      return createResponse(200, { message: 'Report created' });
    }
  } catch (error) {
    console.error('Error in saveRentalReport:', error);
    return createResponse(500, { error: 'Internal Server Error' });
  }
};

const deleteRentalReport = async (reportId: string, userId: string) => {
  console.log('deleteRentalReport called with:', { reportId, userId });

  try {
    console.log(`Fetching report with reportId: ${reportId} for deletion...`);
    const { Item } = await ddbDocClient.send(
      new GetCommand({
        TableName: TABLE_NAME,
        Key: {
          reportId,
        },
      })
    );

    const typedItem = Item as IRentalReportDatabaseEntry;
    if (!typedItem) {
      console.log(`Report not found with reportId: ${reportId}`);
      return createResponse(404, { error: 'Report not found' });
    }

    if (typedItem.userId !== userId) {
      console.warn(
        `User mismatch when deleting. Found userId: ${typedItem.userId}, Request userId: ${userId}`
      );
      return createResponse(403, { error: 'AccessDeniedException' });
    }

    console.log('Deleting report...');
    await ddbDocClient.send(
      new DeleteCommand({
        TableName: TABLE_NAME,
        Key: {
          reportId,
        },
      })
    );

    console.log('Report deleted successfully.');
    return createResponse(200, { message: 'Report deleted' });
  } catch (error) {
    console.error('Error in deleteRentalReport:', error);
    return createResponse(500, { error: 'Internal Server Error' });
  }
};

const getAllRentalReports = async (userId: string) => {
  console.log('getAllRentalReports called with:', { userId });

  try {
    console.log(`Fetching all reports for userId: ${userId}`);
    const { Items } = await ddbDocClient.send(
      new QueryCommand({
        TableName: TABLE_NAME,
        IndexName: USER_ID_INDEX,
        KeyConditionExpression: 'userId = :userId',
        ExpressionAttributeValues: {
          ':userId': userId,
        },
      })
    );
    const typedItems = Items as IRentalReportDatabaseEntry[];

    if (!typedItems || typedItems.length === 0) {
      console.log(`No reports found for userId: ${userId}`);
      return createResponse(200, {});
    }
    
    // Call requestRentalReport in parallel for each typedItem.
    console.log('Calling requestRentalReport in parallel for each item...');
    const reportsArray = await Promise.all(
      typedItems.map((item) => requestRentalReport(item.reportId))
    );

    // Build a map of reportId -> the corresponding report data
    const reportsMap = typedItems.reduce<Record<string, IRentalCalculatorData>>(
      (acc, item, index) => {
        if (reportsArray[index]) {
          acc[item.reportId] = reportsArray[index].reportData;
        }
        return acc;
      },
      {}
    );

    console.log('Reports found. Returning reports...');
    return createResponse(200, reportsMap);
  } catch (error) {
    console.error('Error in getAllRentalReports:', error);
    return createResponse(500, { error: 'Internal Server Error' });
  }
};