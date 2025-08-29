import Cookies from "js-cookie";

interface ApiError {
  message: string;
}

async function request<T>(
  url: string,
  options: RequestInit = {},
  retry = true
): Promise<T> {
  const accessToken = Cookies.get("accessToken");

  const headers = {
    "Content-Type": "application/json",
    ...(accessToken ? { Authorization: accessToken } : {}),
    ...options.headers,
  };

  const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}${url}`, {
    ...options,
    headers,
  });

  const result = await res.json().catch(() => ({}));

  if (res.status === 401 && retry) {
    // token expired -> refresh
    const refreshToken = Cookies.get("refreshToken");
    if (refreshToken) {
      const tokens = await request<{
        accessToken: string;
        refreshToken: string;
      }>(
        "/refresh-token",
        {
          method: "POST",
          body: JSON.stringify({ refreshToken }),
        },
        false
      );
      Cookies.set("accessToken", tokens.accessToken);
      Cookies.set("refreshToken", tokens.refreshToken);
      return request<T>(url, options, false); // retry original request
    }
  }

  if (!res.ok) {
    throw new Error((result as ApiError).message || "API request failed");
  }

  return result as T;
}

export const apiClient = {
  get: <T>(url: string) => request<T>(url),
  post: <T>(url: string, body: unknown) =>
    request<T>(url, { method: "POST", body: JSON.stringify(body) }),
  put: <T>(url: string, body: unknown) =>
    request<T>(url, { method: "PUT", body: JSON.stringify(body) }),
};
