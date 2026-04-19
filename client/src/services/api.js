import axios from "axios";

export const SERVER_URL =
  import.meta.env.VITE_SERVER_URL || "http://localhost:8000";

export const api = axios.create({
  baseURL: `${SERVER_URL}/api`,
  withCredentials: true,
  timeout: 60_000,
});

export function getUserFacingApiMessage(error, fallback) {
  const status = error?.response?.status;
  const message = error?.response?.data?.message;

  if (status === 401) {
    return "Please sign in to continue.";
  }

  if (status === 402) {
    return message || "You do not have enough credits to continue.";
  }

  if (status === 429) {
    return "Too many requests right now. Please wait a moment and try again.";
  }

  if (status >= 500) {
    return fallback;
  }

  return message || fallback;
}

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 402) {
      window.dispatchEvent(
        new CustomEvent("credits-exhausted", {
          detail: error.response.data,
        })
      );
    }
    return Promise.reject(error);
  }
);
