const logger = require("../config/logger");

const errorMiddleware = (err, req, res, next) => {
  const statusCode = err.status || err.statusCode || 500;
  const message = err.message || "Internal Server Error";

  logger.error(
    `${statusCode} - ${message} - ${req.originalUrl} - ${req.method} - ${req.ip}`,
    {
      stack: err.stack,
      requestId: req.headers["x-request-id"],
    },
  );

  res.status(statusCode).json({
    success: false,
    message,
    status: statusCode,
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
};

module.exports = errorMiddleware;
