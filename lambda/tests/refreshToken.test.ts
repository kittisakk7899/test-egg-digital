import { handler } from "../refreshToken";
import { LambdaEvent, RefreshBody } from "../types";
import * as CognitoModule from "@aws-sdk/client-cognito-identity-provider";

// Mock AWS SDK
jest.mock("@aws-sdk/client-cognito-identity-provider", () => {
  const sendMock = jest.fn();
  return {
    CognitoIdentityProviderClient: jest.fn(() => ({ send: sendMock })),
    AdminInitiateAuthCommand: jest.fn(),
    __sendMock: sendMock,
  };
});

const sendMock = (CognitoModule as any).__sendMock as jest.Mock;

describe("refreshToken Lambda", () => {
  beforeEach(() => {
    sendMock.mockReset();
  });

  it("should return 400 if body missing", async () => {
    const event: LambdaEvent = {};
    const result = await handler(event);
    expect(result.statusCode).toBe(400);
  });

  it("should return 400 if refreshToken missing", async () => {
    const body: Partial<RefreshBody> = {};
    const event: LambdaEvent = { body: JSON.stringify(body) };
    const result = await handler(event);
    expect(result.statusCode).toBe(400);
  });

  it("should return 200 if refresh succeeds", async () => {
    sendMock.mockResolvedValue({
      AuthenticationResult: { AccessToken: "access123", IdToken: "id123" },
    });
    const body: RefreshBody = { refreshToken: "rt-123" };
    const event: LambdaEvent = { body: JSON.stringify(body) };
    const result = await handler(event);
    expect(result.statusCode).toBe(200);
    const resBody = JSON.parse(result.body);
    expect(resBody).toMatchObject({
      accessToken: "access123",
      idToken: "id123",
    });
  });

  it("should return 500 if Cognito throws error", async () => {
    sendMock.mockRejectedValue(new Error("Cognito error"));
    const body: RefreshBody = { refreshToken: "rt-123" };
    const event: LambdaEvent = { body: JSON.stringify(body) };
    const result = await handler(event);
    expect(result.statusCode).toBe(500);
  });
});
