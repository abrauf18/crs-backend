const jwtUtils = require("../utils/jwt"); // Adjust the path as needed
const { User } = require("../models");

export default authMiddleware = async (req, res, next) => {
  // 1) Getting token and check if it's there
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  } else if (req?.cookies?.jwt) {
    token = req.cookies.jwt;
  }

  if (!token) {
    return res.status(401).json({
      status: "error",
      message: "You are not logged in! Please log in to get access.",
    });
  }

  // 2) Verification token
  const decoded = jwtUtils.verifyAccessToken(token);

  if (!decoded) {
    return res.status(401).json({
      status: "error",
      message: "Token verification failed. Please log in again.",
    });
  }

  // 3) Check if user still exists
  const currentUser = await User.findById(decoded.id);
  if (!currentUser) {
    return res.status(401).json({
      status: "error",
      message: "The user belonging to this token does no longer exist.",
    });
  }

  // 4) Check if user changed password after the token was issued
  if (currentUser.changedPasswordAfter(decoded.iat)) {
    return res.status(401).json({
      status: "error",
      message: "User recently changed password! Please log in again.",
    });
  }

  // GRANT ACCESS TO PROTECTED ROUTE
  req.user = currentUser;
  res.locals.user = currentUser;
  next();
};

module.exports = protect;
