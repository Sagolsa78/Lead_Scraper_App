const responseFormatter = (data, message = "Success", statusCode = 200) => {
  return {
    success: true,
    message,
    statusCode,
    timestamp: new Date().toISOString(),
    data,
  };
};

module.exports = responseFormatter;
