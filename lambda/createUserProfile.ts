import {
  CognitoIdentityProviderClient,
  AdminCreateUserCommand,
  AdminSetUserPasswordCommand,
} from "@aws-sdk/client-cognito-identity-provider";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand } from "@aws-sdk/lib-dynamodb";

import { LambdaEvent, LambdaResponse, CreateUserProfileBody } from "./types";

const REGION = process.env.AWS_REGION || "ap-southeast-2";
const USER_POOL_ID = process.env.USER_POOL_ID || "";
const ddbClient = new DynamoDBClient({ region: REGION });
const dynamo = DynamoDBDocumentClient.from(ddbClient);

// Cognito client
const cognitoClient = new CognitoIdentityProviderClient({ region: REGION });

export const handler = async (event: LambdaEvent): Promise<LambdaResponse> => {
  try {
    if (!event.body) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: "Missing request body" }),
      };
    }

    const { username, email, password, name }: CreateUserProfileBody = JSON.parse(event.body);

    if (!username || !email || !password || !name) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: "Missing required fields" }),
      };
    }

    // สร้าง user ใน Cognito และ suppress email
    const createUserCmd = new AdminCreateUserCommand({
      UserPoolId: USER_POOL_ID,
      Username: username,
      UserAttributes: [
        { Name: "email", Value: email },
        { Name: "name", Value: name },
      ],
      MessageAction: "SUPPRESS",
    });

    const cognitoRes = await cognitoClient.send(createUserCmd);

    // ตั้งรหัสผ่านแบบ permanent
    await cognitoClient.send(
      new AdminSetUserPasswordCommand({
        UserPoolId: USER_POOL_ID,
        Username: username,
        Password: password,
        Permanent: true,
      })
    );

    // หา sub จาก attributes ของ Cognito
    const subAttr = cognitoRes.User?.Attributes?.find((attr) => attr.Name === "sub");
    const userId = subAttr?.Value;

    const item = {
      userId,
      username,
      email,
      name,
      createdAt: new Date().toISOString(),
    };

    await dynamo.send(
      new PutCommand({
        TableName: "UserProfiles",
        Item: item,
      })
    );

    return { statusCode: 201, body: JSON.stringify(item) };
  } catch (err: any) {
    console.error("CreateUserProfile error:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: err.message }),
    };
  }
};
