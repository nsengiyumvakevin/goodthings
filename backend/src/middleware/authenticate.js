const jwt = require("jsonwebtoken");

module.exports = function authenticate(roles = []) {
  return (req, res, next) => {
    const token = req.headers.authorization?.replace(/^Bearer\s+/i, "");
    if (!token) return res.status(401).json({ error: "Sign in to continue." });
    if (process.env.NODE_ENV === "production" && !process.env.JWT_SECRET) {
      return res
        .status(503)
        .json({ error: "JWT_SECRET must be configured in production." });
    }
    try {
      const payload = jwt.verify(
        token,
        process.env.JWT_SECRET || "local-development-secret-change-me",
      );
      if (roles.length && !roles.includes(payload.role)) {
        return res
          .status(403)
          .json({ error: "You do not have permission to do that." });
      }
      req.auth = payload;
      next();
    } catch {
      return res
        .status(401)
        .json({ error: "Your session has expired. Please sign in again." });
    }
  };
};
