import { handler } from "../createUserProfile";
import { LambdaEvent, CreateUserProfileBody } from "../types";
import {
  CognitoIdentityProviderClient,
  AdminCreateUserCommand,
  AdminSetUserPasswordCommand,
} from "@aws-sdk/client-cognito-identity-provider";
import { DynamoDBDocumentClient, PutCommand } from "@aws-sdk/lib-dynamodb";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";

// mock AWS SDK
jest.mock("@aws-sdk/client-cognito-identity-provider", () => ({
  CognitoIdentityProviderClient: jest.fn(() => ({ send: jest.fn() })),
  AdminCreateUserCommand: jest.fn(),
  AdminSetUserPasswordCommand: jest.fn(),
}));

jest.mock("@aws-sdk/lib-dynamodb", () => ({
  DynamoDBDocumentClient: { from: jest.fn(() => ({ send: jest.fn() })) },
  PutCommand: jest.fn(),
}));

describe("createUserProfile Lambda", () => {
  let mockCognitoSend: jest.Mock;
  let mockDynamoSend: jest.Mock;

  beforeEach(() => {
    mockCognitoSend = (CognitoIdentityProviderClient as jest.Mock).mock.results[0].value.send;
    const dynamoInstance = DynamoDBDocumentClient.from({} as DynamoDBClient);
    mockDynamoSend = dynamoInstance.send as jest.Mock;
    mockCognitoSend.mockReset();
    mockDynamoSend.mockReset();
  });

  it("should return 400 if body missing", async () => {
    const event: LambdaEvent = {};
    const result = await handler(event);
    expect(result.statusCode).toBe(400);
  });

  it("should return 400 if required fields missing", async () => {
    const body: Partial<CreateUserProfileBody> = { username: "user1" };
    const event: LambdaEvent = { body: JSON.stringify(body) };
    const result = await handler(event);
    expect(result.statusCode).toBe(400);
  });

  it("should return 201 if creation succeeds", async () => {
    mockCognitoSend.mockResolvedValueOnce({ User: { Attributes: [{ Name: "sub", Value: "sub-123" }] } });
    mockCognitoSend.mockResolvedValueOnce({});
    mockDynamoSend.mockResolvedValue({});

    const body: CreateUserProfileBody = {
      username: "user1",
      email: "user1@example.com",
      password: "Passw0rd!",
      name: "User One",
    };
    const event: LambdaEvent = { body: JSON.stringify(body) };
    const result = await handler(event);
    expect(result.statusCode).toBe(201);
    const resBody = JSON.parse(result.body);
    expect(resBody).toMatchObject({ userId: "sub-123", username: "user1", email: "user1@example.com", name: "User One" });
  });

  it("should return 500 if Cognito throws error", async () => {
    mockCognitoSend.mockRejectedValue(new Error("Cognito error"));
    const body: CreateUserProfileBody = {
      username: "user1",
      email: "user1@example.com",
      password: "Passw0rd!",
      name: "User One",
    };
    const event: LambdaEvent = { body: JSON.stringify(body) };
    const result = await handler(event);
    expect(result.statusCode).toBe(500);
  });
});
