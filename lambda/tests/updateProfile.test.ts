// Mock send ของ Cognito และ DynamoDB
const cognitoSendMock = jest.fn();
const dynamoSendMock = jest.fn();

// Mock AWS SDK ก่อน import handler
jest.mock("@aws-sdk/client-cognito-identity-provider", () => ({
  CognitoIdentityProviderClient: jest.fn(() => ({ send: cognitoSendMock })),
  AdminCreateUserCommand: jest.fn(),
  AdminSetUserPasswordCommand: jest.fn(),
}));

jest.mock("@aws-sdk/lib-dynamodb", () => ({
  DynamoDBDocumentClient: { from: jest.fn(() => ({ send: dynamoSendMock })) },
  PutCommand: jest.fn(),
}));

// Import handler หลังจาก mock เสร็จ
import { handler } from "../createUserProfile";
import { LambdaEvent, CreateUserProfileBody } from "../types";

describe("createUserProfile Lambda", () => {
  beforeEach(() => {
    cognitoSendMock.mockReset();
    dynamoSendMock.mockReset();
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
    cognitoSendMock.mockResolvedValueOnce({ User: { Attributes: [{ Name: "sub", Value: "sub-123" }] } });
    cognitoSendMock.mockResolvedValueOnce({});
    dynamoSendMock.mockResolvedValue({});

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
    expect(resBody).toMatchObject({
      userId: "sub-123",
      username: "user1",
      email: "user1@example.com",
      name: "User One",
    });
  });

  it("should return 500 if Cognito throws error", async () => {
    cognitoSendMock.mockRejectedValue(new Error("Cognito error"));
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
