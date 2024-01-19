const jwt = require("jsonwebtoken");

function generateAccessToken(payload) {
  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: "1h",
  });
}

module.exports = {
  generateAccessToken,
};
