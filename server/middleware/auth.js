// Middleware to extract and verify user ID from Stack Auth
// The user ID should be sent from the frontend in the X-User-Id header
// In production, you should verify the session token server-side

const authenticateUser = (req, res, next) => {
  // Get user ID from header (sent by frontend)
  const userId = req.headers["x-user-id"];

  if (!userId) {
    return res
      .status(401)
      .json({ message: "Unauthorized: User ID is required" });
  }

  // Attach userId to request object for use in routes
  req.userId = userId;
  next();
};

module.exports = { authenticateUser };
