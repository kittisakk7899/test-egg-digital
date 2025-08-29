import {
  CognitoIdentityProviderClient,
  InitiateAuthCommand,
} from "@aws-sdk/client-cognito-identity-provider";
import { LambdaEvent, LambdaResponse, SignInBody } from "./types";

const REGION = process.env.AWS_REGION || "ap-southeast-2";
const CLIENT_ID = process.env.CLIENT_ID || "";

const client = new CognitoIdentityProviderClient({ region: REGION });

export const handler = async (event: LambdaEvent): Promise<LambdaResponse> => {
  try {
    if (!event.body) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: "Missing request body" }),
      };
    }

    const { username, password }: SignInBody = JSON.parse(event.body);

    if (!username || !password) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: "Missing username or password" }),
      };
    }

    const command = new InitiateAuthCommand({
      AuthFlow: "USER_PASSWORD_AUTH",
      ClientId: CLIENT_ID,
      AuthParameters: { USERNAME: username, PASSWORD: password },
    });

    const response = await client.send(command);

    if (!response.AuthenticationResult) {
      return { statusCode: 401, body: JSON.stringify({ message: "Login failed" }) };
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        idToken: response.AuthenticationResult.IdToken,
        accessToken: response.AuthenticationResult.AccessToken,
        refreshToken: response.AuthenticationResult.RefreshToken,
        expiresIn: response.AuthenticationResult.ExpiresIn,
        tokenType: response.AuthenticationResult.TokenType,
      }),
    };
  } catch (err: any) {
    console.error("Login error:", err);
    return { statusCode: 500, body: JSON.stringify({ message: err.message }) };
  }
};
