import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { LambdaEvent, LambdaResponse, UpdateProfileBody } from "./types";

const client = new DynamoDBClient({
  region: process.env.AWS_REGION || "ap-southeast-2",
});
const dynamo = DynamoDBDocumentClient.from(client);

export const handler = async (event: LambdaEvent): Promise<LambdaResponse> => {
  const userId = event.requestContext?.authorizer?.jwt?.claims?.sub;
  if (!userId) return { statusCode: 401, body: "Unauthorized" };

  if (!event.body) return { statusCode: 400, body: "Missing request body" };

  const data: UpdateProfileBody = JSON.parse(event.body);
  if (!data.name || !data.email)
    return { statusCode: 400, body: "Invalid input: name and email required" };

  const result = await dynamo.send(
    new UpdateCommand({
      TableName: "UserProfiles",
      Key: { userId },
      UpdateExpression:
        "SET #name = :name, #email = :email, #updatedAt = :updatedAt",
      ExpressionAttributeNames: {
        "#name": "name",
        "#email": "email",
        "#updatedAt": "updatedAt",
      },
      ExpressionAttributeValues: {
        ":name": data.name,
        ":email": data.email,
        ":updatedAt": new Date().toISOString(),
      },
      ReturnValues: "ALL_NEW",
    })
  );

  return { statusCode: 200, body: JSON.stringify(result.Attributes) };
};
