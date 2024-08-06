import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { DynamoDB } from 'aws-sdk';
import { hash, genSalt, compare } from 'bcryptjs'; // Import bcrypt functions
//import { sendVerificationEmail, sendPasswordRecoveryEmail } from './emailService'; // Import email service functions

const dynamodb = new DynamoDB.DocumentClient();

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const { operation, emailAddress, password, firstName, lastName, gender, dateOfBirth } = event as any;

  try {
    switch (operation) {
      case 'signup':
        // Check if the user already exists
        const existingUser = await getUserByEmail(emailAddress);
        if (existingUser) {
          return { statusCode: 400, body: 'User already exists.' };
        }

        // Generate confirmation token and token generation time
        const confirmationToken = generateUUID();
        const tokenGenerationTime = new Date().toISOString();

        // Create a new user
        const userId = generateUUID();
        const salt = await genSalt(10); // Generate salt
        const hashedPassword = await hash(password, salt); // Hash password with salt
        await createUser(userId, emailAddress, hashedPassword, salt, firstName, lastName, gender, dateOfBirth, confirmationToken, tokenGenerationTime); // Store user data
        // Send verification email
        //await sendVerificationEmail(emailAddress, confirmationToken);
        return { statusCode: 200, body: 'User signed up successfully. Verification email sent.' };

      case 'login':
        // Retrieve the user by email
        const user = await getUserByEmail(emailAddress);
        if (!user) {
          return { statusCode: 401, body: 'Invalid credentials.' };
        }

        // Verify password
        const passwordsMatch = await compare(password, user.PasswordHash);
        if (!passwordsMatch) {
          return { statusCode: 401, body: 'Invalid credentials.' };
        }

        return { statusCode: 200, body: 'User logged in successfully.' };

      case 'updateUserInfo':
        // Update user information
        await updateUserInformation(emailAddress, firstName, lastName, gender, dateOfBirth);
        return { statusCode: 200, body: 'User information updated successfully.' };

      case 'forgotPassword':
        // Generate recovery token and token generation time
        const recoveryToken = generateUUID();
        const recoveryTokenTime = new Date().toISOString();
        // Update user with recovery token and time
        await updatePasswordRecoveryToken(emailAddress, recoveryToken, recoveryTokenTime);
        // Send password recovery email
        //await sendPasswordRecoveryEmail(emailAddress, recoveryToken);
        return { statusCode: 200, body: 'Password recovery email sent.' };

      default:
        return { statusCode: 400, body: 'Invalid operation.' };
    }
  } catch (error) {
    console.error('Error:', error);
    return { statusCode: 500, body: JSON.stringify(error) };
  }
};

async function getUserByEmail(emailAddress: string) {
  const params = {
    TableName: 'Users',
    Key: {
      'EmailAddress': emailAddress
    }
  };

  const data = await dynamodb.get(params).promise();
  return data.Item;
}

async function createUser(userId: string, emailAddress: string, hashedPassword: string, salt: string, firstName: string, lastName: string, gender: string, dateOfBirth: string, confirmationToken: string, tokenGenerationTime: string) {
  const params = {
    TableName: 'Users',
    Item: {
      'UserId': userId,
      'EmailAddress': emailAddress,
      'PasswordHash': hashedPassword,
      'PasswordSalt': salt,
      'FirstName': firstName,
      'LastName': lastName,
      'Gender': gender,
      'DateOfBirth': dateOfBirth,
      'ConfirmationToken': confirmationToken,
      'TokenGenerationTime': tokenGenerationTime,
      'EmailValidationStatusId': 1 // Assuming 1 represents unverified email
    }
  };

  await dynamodb.put(params).promise();
}

async function updateUserInformation(emailAddress: string, firstName: string, lastName: string, gender: string, dateOfBirth: string) {
  const params = {
    TableName: 'Users',
    Key: {
      'EmailAddress': emailAddress
    },
    UpdateExpression: 'set FirstName = :fn, LastName = :ln, Gender = :g, DateOfBirth = :dob',
    ExpressionAttributeValues: {
      ':fn': firstName,
      ':ln': lastName,
      ':g': gender,
      ':dob': dateOfBirth
    }
  };

  await dynamodb.update(params).promise();
}

async function updatePasswordRecoveryToken(emailAddress: string, recoveryToken: string, recoveryTokenTime: string) {
  const params = {
    TableName: 'Users',
    Key: {
      'EmailAddress': emailAddress
    },
    UpdateExpression: 'set PasswordRecoveryToken = :rt, RecoveryTokenTime = :rtt',
    ExpressionAttributeValues: {
      ':rt': recoveryToken,
      ':rtt': recoveryTokenTime
    }
  };

  await dynamodb.update(params).promise();
}

function generateUUID() {
  // Generate a unique user ID (you may use UUID or any other method)
  return Math.random().toString(36).substring(2);
}