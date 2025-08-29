import { apiClient } from "./apiClient";

interface SigninResponse {
  idToken: string;
  accessToken: string;
  refreshToken: string;
  expiresIn?: number;
  tokenType?: string;
}

export async function fetchProfile() {
  return apiClient.get("/profile");
}

export async function updateProfile(data: { name: string; email: string }) {
  return apiClient.put("/profile", data);
}

export async function signup(data: {
  username: string;
  email: string;
  password: string;
  name: string;
}) {
  return apiClient.post<{
    username: string;
    email: string;
    name: string;
    userId: string;
    createdAt: string;
  }>("/signup", data);
}

export async function signin(data: { username: string; password: string }) {
  return apiClient.post<SigninResponse>("/signin", data);
}

export async function refreshToken(token: string) {
  return apiClient.post<SigninResponse>("/refresh-token", { refreshToken: token });
}
