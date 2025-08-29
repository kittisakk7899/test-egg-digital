import { handler } from "../signin";
import { LambdaEvent, SignInBody } from "../types";
import * as CognitoModule from "@aws-sdk/client-cognito-identity-provider";

// Mock AWS SDK
jest.mock("@aws-sdk/client-cognito-identity-provider", () => {
  const sendMock = jest.fn();
  return {
    CognitoIdentityProviderClient: jest.fn(() => ({ send: sendMock })),
    InitiateAuthCommand: jest.fn(),
    __sendMock: sendMock, // export สำหรับใช้ใน beforeEach
  };
});

// import sendMock จาก mock
const sendMock = (CognitoModule as any).__sendMock as jest.Mock;

describe("signin Lambda", () => {
  beforeEach(() => {
    sendMock.mockReset();
  });

  it("should return 400 if body missing", async () => {
    const event: LambdaEvent = {};
    const result = await handler(event);
    expect(result.statusCode).toBe(400);
  });

  it("should return 400 if username/password missing", async () => {
    const body: Partial<SignInBody> = { username: "user1" };
    const event: LambdaEvent = { body: JSON.stringify(body) };
    const result = await handler(event);
    expect(result.statusCode).toBe(400);
  });

  it("should return 401 if AuthenticationResult missing", async () => {
    sendMock.mockResolvedValue({});
    const body: SignInBody = { username: "user1", password: "pass" };
    const event: LambdaEvent = { body: JSON.stringify(body) };
    const result = await handler(event);
    expect(result.statusCode).toBe(401);
  });

  it("should return 200 if login succeeds", async () => {
    sendMock.mockResolvedValue({
      AuthenticationResult: {
        IdToken: "id123",
        AccessToken: "access123",
        RefreshToken: "refresh123",
        ExpiresIn: 3600,
        TokenType: "Bearer",
      },
    });
    const body: SignInBody = { username: "user1", password: "pass" };
    const event: LambdaEvent = { body: JSON.stringify(body) };
    const result = await handler(event);
    expect(result.statusCode).toBe(200);
    const resBody = JSON.parse(result.body);
    expect(resBody).toMatchObject({
      idToken: "id123",
      accessToken: "access123",
      refreshToken: "refresh123",
      expiresIn: 3600,
      tokenType: "Bearer",
    });
  });

  it("should return 500 if Cognito throws error", async () => {
    sendMock.mockRejectedValue(new Error("Cognito error"));
    const body: SignInBody = { username: "user1", password: "pass" };
    const event: LambdaEvent = { body: JSON.stringify(body) };
    const result = await handler(event);
    expect(result.statusCode).toBe(500);
  });
});
