const jwt = require("jsonwebtoken");

function generateAccessToken(payload) {
  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: "1h",
  });
}

function verifyAccessToken(token) {
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    return decoded;
  } catch (error) {
    return null; // Token verification failed
  }
}

function generateForgotPasswordToken(payload) {
  return jwt.sign(payload, process.env.JWT_SECRET_FORGOT_PASSWORD, {
    expiresIn: "1h",
  });
}

function verifyForgotPasswordToken(token) {
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET_FORGOT_PASSWORD);
    return decoded;
  } catch (error) {
    return null; // Token verification failed
  }
}

module.exports = {
  generateAccessToken,
  verifyAccessToken,
  generateForgotPasswordToken,
  verifyForgotPasswordToken
};
