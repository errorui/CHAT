// must match the expiry in generateToken
const MAX_AGE = 3 * 24 * 60 * 60 * 1000;

const options = {
  httpOnly: true,
  secure: true,
  sameSite: "none", // the frontend is on another site
};

const setAuthCookie = (res, token) =>
  res.cookie("token", token, { ...options, maxAge: MAX_AGE });

const clearAuthCookie = (res) => res.clearCookie("token", options);

module.exports = { setAuthCookie, clearAuthCookie };
