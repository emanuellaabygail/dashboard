import axios from "axios";

const apiBaseUrl =
  import.meta.env.VITE_API_BASE_URL ||
  `${window.location.protocol}//${window.location.hostname}:8000/api`;

export const httpClient = axios.create({
  baseURL: apiBaseUrl,
  headers: {
    "Content-Type": "application/json"
  },
  timeout: 15_000,
  withCredentials: true,
  xsrfCookieName: "csrftoken",
  xsrfHeaderName: "X-CSRFToken"
});

const csrfSafeMethods = new Set(["get", "head", "options"]);

function readCsrfCookie(): string | undefined {
  const match = document.cookie.match(/(?:^|; )csrftoken=([^;]*)/);
  return match ? decodeURIComponent(match[1]) : undefined;
}

httpClient.interceptors.request.use((config) => {
  const method = config.method?.toLowerCase();
  if (method && !csrfSafeMethods.has(method)) {
    const csrfToken = readCsrfCookie();
    if (csrfToken) {
      config.headers.set("X-CSRFToken", csrfToken);
    }
  }
  return config;
});
