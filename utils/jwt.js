const jwt = require("jsonwebtoken");

function generateAccessToken(payload) {
  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: "24h",
  });
}

function verifyAccessToken(token) {
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    return { success: true, decoded };
  } 
  catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      return { success: false, error: "Token expired" }
    }
    return { success: false, error: "Token verification failed" };
  }
}

module.exports = {
  generateAccessToken,
  verifyAccessToken
};
