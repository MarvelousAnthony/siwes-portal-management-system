const API_BASE_URL = (import.meta as any).env.VITE_API_BASE_URL || "http://localhost:4000/api";

// Helper to get JWT token from localStorage
export const getAuthToken = (): string | null => {
  return localStorage.getItem("siwes_token");
};

// Helper to set JWT token in localStorage
export const setAuthToken = (token: string) => {
  localStorage.setItem("siwes_token", token);
};

// Helper to clear JWT token
export const clearAuthToken = () => {
  localStorage.removeItem("siwes_token");
};

// Perform authenticated fetch requests
export const apiRequest = async (
  endpoint: string,
  method: "GET" | "POST" | "PUT" | "DELETE" = "GET",
  body?: any
) => {
  const token = getAuthToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `HTTP error! Status: ${response.status}`);
  }

  return response.status === 204 ? null : response.json();
};
