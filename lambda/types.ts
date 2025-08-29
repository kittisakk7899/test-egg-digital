export interface LambdaEvent {
  requestContext?: {
    authorizer?: {
      jwt?: {
        claims?: {
          sub?: string;
        };
      };
    };
  };
  body?: string;
}

export interface LambdaResponse {
  statusCode: number;
  body: string;
}


export interface CreateUserProfileBody {
  username: string;
  email: string;
  password: string;
  name: string;
}

export interface SignInBody {
  username: string;
  password: string;
}

export interface RefreshBody {
  refreshToken: string;
}

export interface UpdateProfileBody {
  name: string;
  email: string;
}