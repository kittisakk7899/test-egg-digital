import {
  CognitoIdentityProviderClient,
  AdminInitiateAuthCommand,
} from "@aws-sdk/client-cognito-identity-provider";
import { LambdaEvent, LambdaResponse, RefreshBody } from "./types";

const REGION = process.env.AWS_REGION || "ap-southeast-2";
const USER_POOL_ID = process.env.USER_POOL_ID || "";
const CLIENT_ID = process.env.CLIENT_ID || "";

const client = new CognitoIdentityProviderClient({ region: REGION });

export const handler = async (event: LambdaEvent): Promise<LambdaResponse> => {
  try {
    if (!event.body) {
      return { statusCode: 400, body: JSON.stringify({ message: "Missing request body" }) };
    }

    const { refreshToken }: RefreshBody = JSON.parse(event.body);

    if (!refreshToken) {
      return { statusCode: 400, body: JSON.stringify({ message: "Missing refreshToken" }) };
    }

    const command = new AdminInitiateAuthCommand({
      UserPoolId: USER_POOL_ID,
      ClientId: CLIENT_ID,
      AuthFlow: "REFRESH_TOKEN_AUTH",
      AuthParameters: { REFRESH_TOKEN: refreshToken },
    });

    const response = await client.send(command);

    return {
      statusCode: 200,
      body: JSON.stringify({
        accessToken: response.AuthenticationResult?.AccessToken,
        idToken: response.AuthenticationResult?.IdToken,
      }),
    };
  } catch (err: any) {
    console.error("Refresh error:", err);
    return { statusCode: 500, body: JSON.stringify({ message: err.message }) };
  }
};
