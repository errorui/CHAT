const crypto = require("crypto");
const { rateLimit, ipKeyGenerator } = require("express-rate-limit");

const WINDOW_MINUTES = 15;

// The account, not the typed text: login treats look-alike spellings as the same email
const accountKey = (req) =>
  req.loginUser ? `id:${req.loginUser._id}` : `email:${req.body.email.trim().toLowerCase()}`;

// Requests come through Vercel, which puts the visitor first in x-forwarded-for
const clientKey = (req) => {
  const forwarded = req.get("x-forwarded-for")?.split(",")[0].trim();
  return ipKeyGenerator(forwarded || req.socket.remoteAddress || "unknown");
};

const limitFailedLogins = (limit, key) =>
  rateLimit({
    windowMs: WINDOW_MINUTES * 60 * 1000,
    limit,
    // hashed, so a huge email or header can't fill up memory
    keyGenerator: (req) => crypto.createHash("sha256").update(key(req)).digest("base64url"),
    // counted on arrival so parallel guesses can't slip through, refunded unless the password was wrong
    skipSuccessfulRequests: true,
    requestWasSuccessful: (req, res) => res.statusCode !== 401,
    standardHeaders: "draft-7",
    legacyHeaders: false,
    message: { message: `Too many sign-in attempts. Try again in ${WINDOW_MINUTES} minutes.` },
  });

const limitLoginPerClient = limitFailedLogins(10, (req) => `${accountKey(req)}|${clientKey(req)}`);

module.exports = { limitLoginPerClient };
