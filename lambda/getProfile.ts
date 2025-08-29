import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, GetCommand } from "@aws-sdk/lib-dynamodb";
import { LambdaEvent, LambdaResponse } from "./types";

const client = new DynamoDBClient({
  region: process.env.AWS_REGION || "ap-southeast-2",
});
const dynamo = DynamoDBDocumentClient.from(client);

export const handler = async (event: LambdaEvent): Promise<LambdaResponse> => {
  try {
    console.log("EVENT RECEIVED:", JSON.stringify(event));

    const userId = event.requestContext?.authorizer?.jwt?.claims?.sub;
    if (!userId) {
      return { statusCode: 401, body: "Unauthorized" };
    }

    const result = await dynamo.send(
      new GetCommand({
        TableName: "UserProfiles",
        Key: { userId },
      })
    );

    if (!result.Item) {
      return { statusCode: 404, body: "Profile not found" };
    }

    return {
      statusCode: 200,
      body: JSON.stringify(result.Item),
    };
  } catch (err: any) {
    console.error("ERROR:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: err.message }),
    };
  }
};
