import axios from "axios";

export const errorMessage = (error: unknown, fallback = "Something went wrong. Please try again.") => {
  if (!axios.isAxiosError(error)) return fallback;

  const status = error.response?.status;
  // no response, or the proxy could not reach the api
  if (!status || status >= 500) return "Can't reach the server right now. Give it a moment and try again.";

  // "err" is what older api builds use
  const message = error.response?.data?.message ?? error.response?.data?.err;
  return typeof message === "string" && message ? message : fallback;
};
