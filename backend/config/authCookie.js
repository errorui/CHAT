// must match the expiry in generateToken
const MAX_AGE = 3 * 24 * 60 * 60 * 1000;

const allClientsPlainHttp = () => {
  const urls = (process.env.CLIENT_URL || "").split(",").map((url) => url.trim()).filter(Boolean);
  return urls.length > 0 && urls.every((url) => url.startsWith("http://"));
};

// a function, because dotenv has not loaded yet when this file is required
const options = () => ({
  httpOnly: true,
  // only plain http during local development
  secure: !allClientsPlainHttp(),
  sameSite: "lax", // the frontend proxies /api, so this is a first party cookie
});

const setAuthCookie = (res, token) =>
  res.cookie("token", token, { ...options(), maxAge: MAX_AGE });

const clearAuthCookie = (res) => res.clearCookie("token", options());

module.exports = { setAuthCookie, clearAuthCookie };
