var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
import { DynamoDB } from 'aws-sdk';
import { hash, genSalt, compare } from 'bcryptjs'; // Import bcrypt functions
//import { sendVerificationEmail, sendPasswordRecoveryEmail } from './emailService'; // Import email service functions
var dynamodb = new DynamoDB.DocumentClient();
export var handler = function (event) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, operation, emailAddress, password, firstName, lastName, gender, dateOfBirth, _b, existingUser, confirmationToken, tokenGenerationTime, userId, salt, hashedPassword, user, passwordsMatch, recoveryToken, recoveryTokenTime, error_1;
    return __generator(this, function (_c) {
        switch (_c.label) {
            case 0:
                _a = event, operation = _a.operation, emailAddress = _a.emailAddress, password = _a.password, firstName = _a.firstName, lastName = _a.lastName, gender = _a.gender, dateOfBirth = _a.dateOfBirth;
                _c.label = 1;
            case 1:
                _c.trys.push([1, 16, , 17]);
                _b = operation;
                switch (_b) {
                    case 'signup': return [3 /*break*/, 2];
                    case 'login': return [3 /*break*/, 7];
                    case 'updateUserInfo': return [3 /*break*/, 10];
                    case 'forgotPassword': return [3 /*break*/, 12];
                }
                return [3 /*break*/, 14];
            case 2: return [4 /*yield*/, getUserByEmail(emailAddress)];
            case 3:
                existingUser = _c.sent();
                if (existingUser) {
                    return [2 /*return*/, { statusCode: 400, body: 'User already exists.' }];
                }
                confirmationToken = generateUUID();
                tokenGenerationTime = new Date().toISOString();
                userId = generateUUID();
                return [4 /*yield*/, genSalt(10)];
            case 4:
                salt = _c.sent();
                return [4 /*yield*/, hash(password, salt)];
            case 5:
                hashedPassword = _c.sent();
                return [4 /*yield*/, createUser(userId, emailAddress, hashedPassword, salt, firstName, lastName, gender, dateOfBirth, confirmationToken, tokenGenerationTime)];
            case 6:
                _c.sent(); // Store user data
                // Send verification email
                //await sendVerificationEmail(emailAddress, confirmationToken);
                return [2 /*return*/, { statusCode: 200, body: 'User signed up successfully. Verification email sent.' }];
            case 7: return [4 /*yield*/, getUserByEmail(emailAddress)];
            case 8:
                user = _c.sent();
                if (!user) {
                    return [2 /*return*/, { statusCode: 401, body: 'Invalid credentials.' }];
                }
                return [4 /*yield*/, compare(password, user.PasswordHash)];
            case 9:
                passwordsMatch = _c.sent();
                if (!passwordsMatch) {
                    return [2 /*return*/, { statusCode: 401, body: 'Invalid credentials.' }];
                }
                return [2 /*return*/, { statusCode: 200, body: 'User logged in successfully.' }];
            case 10: 
            // Update user information
            return [4 /*yield*/, updateUserInformation(emailAddress, firstName, lastName, gender, dateOfBirth)];
            case 11:
                // Update user information
                _c.sent();
                return [2 /*return*/, { statusCode: 200, body: 'User information updated successfully.' }];
            case 12:
                recoveryToken = generateUUID();
                recoveryTokenTime = new Date().toISOString();
                // Update user with recovery token and time
                return [4 /*yield*/, updatePasswordRecoveryToken(emailAddress, recoveryToken, recoveryTokenTime)];
            case 13:
                // Update user with recovery token and time
                _c.sent();
                // Send password recovery email
                //await sendPasswordRecoveryEmail(emailAddress, recoveryToken);
                return [2 /*return*/, { statusCode: 200, body: 'Password recovery email sent.' }];
            case 14: return [2 /*return*/, { statusCode: 400, body: 'Invalid operation.' }];
            case 15: return [3 /*break*/, 17];
            case 16:
                error_1 = _c.sent();
                console.error('Error:', error_1);
                return [2 /*return*/, { statusCode: 500, body: JSON.stringify(error_1) }];
            case 17: return [2 /*return*/];
        }
    });
}); };
function getUserByEmail(emailAddress) {
    return __awaiter(this, void 0, void 0, function () {
        var params, data;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    params = {
                        TableName: 'Users',
                        Key: {
                            'EmailAddress': emailAddress
                        }
                    };
                    return [4 /*yield*/, dynamodb.get(params).promise()];
                case 1:
                    data = _a.sent();
                    return [2 /*return*/, data.Item];
            }
        });
    });
}
function createUser(userId, emailAddress, hashedPassword, salt, firstName, lastName, gender, dateOfBirth, confirmationToken, tokenGenerationTime) {
    return __awaiter(this, void 0, void 0, function () {
        var params;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    params = {
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
                    return [4 /*yield*/, dynamodb.put(params).promise()];
                case 1:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    });
}
function updateUserInformation(emailAddress, firstName, lastName, gender, dateOfBirth) {
    return __awaiter(this, void 0, void 0, function () {
        var params;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    params = {
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
                    return [4 /*yield*/, dynamodb.update(params).promise()];
                case 1:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    });
}
function updatePasswordRecoveryToken(emailAddress, recoveryToken, recoveryTokenTime) {
    return __awaiter(this, void 0, void 0, function () {
        var params;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    params = {
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
                    return [4 /*yield*/, dynamodb.update(params).promise()];
                case 1:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    });
}
function generateUUID() {
    // Generate a unique user ID (you may use UUID or any other method)
    return Math.random().toString(36).substring(2);
}
