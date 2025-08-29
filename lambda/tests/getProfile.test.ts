import { handler } from "../getProfile";
import { LambdaEvent } from "../types";
import * as DynamoModule from "@aws-sdk/lib-dynamodb";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";

// Mock AWS SDK
jest.mock("@aws-sdk/lib-dynamodb", () => {
  const sendMock = jest.fn();
  return {
    DynamoDBDocumentClient: {
      from: jest.fn(() => ({ send: sendMock })),
    },
    GetCommand: jest.fn(),
    __sendMock: sendMock,
  };
});

// import sendMock จาก mock
const sendMock = (DynamoModule as any).__sendMock as jest.Mock;

describe("getProfile Lambda", () => {
  beforeEach(() => {
    sendMock.mockReset();
  });

  it("should return 401 if no userId", async () => {
    const event: LambdaEvent = { requestContext: {} };
    const result = await handler(event);
    expect(result.statusCode).toBe(401);
  });

  it("should return 404 if profile not found", async () => {
    const event: LambdaEvent = {
      requestContext: { authorizer: { jwt: { claims: { sub: "user123" } } } },
    };
    sendMock.mockResolvedValue({ Item: null });
    const result = await handler(event);
    expect(result.statusCode).toBe(404);
  });

  it("should return 200 if profile found", async () => {
    const event: LambdaEvent = {
      requestContext: { authorizer: { jwt: { claims: { sub: "user123" } } } },
    };
    sendMock.mockResolvedValue({ Item: { userId: "user123", name: "Alice" } });
    const result = await handler(event);
    expect(result.statusCode).toBe(200);
    const body = JSON.parse(result.body);
    expect(body).toMatchObject({ userId: "user123", name: "Alice" });
  });

  it("should return 500 if DynamoDB throws error", async () => {
    const event: LambdaEvent = {
      requestContext: { authorizer: { jwt: { claims: { sub: "user123" } } } },
    };
    sendMock.mockRejectedValue(new Error("DynamoDB error"));
    const result = await handler(event);
    expect(result.statusCode).toBe(500);
    expect(JSON.parse(result.body).message).toBe("DynamoDB error");
  });
});
