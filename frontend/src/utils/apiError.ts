import axios from "axios";

export function getApiErrorMessage(error: unknown, fallback = "Something went wrong") {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data;
    if (typeof data === "string" && data.trim()) {
      return data;
    }
    if (data && typeof data === "object") {
      const errorMessage = "error" in data && typeof data.error === "string" ? data.error : null;
      if (errorMessage) return errorMessage;

      const message = "message" in data && typeof data.message === "string" ? data.message : null;
      if (message) return message;
    }
    if (error.message) {
      return error.message;
    }
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return fallback;
}
