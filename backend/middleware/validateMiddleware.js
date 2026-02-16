const logger = require("../config/logger");

const validate = (schema) => (req, res, next) => {
  try {
    const validatedData = schema.parse({
      body: req.body,
      query: req.query,
      params: req.params,
    });

    // Replace untrusted input with validated data
    req.body = validatedData.body;
    req.query = validatedData.query;
    req.params = validatedData.params;

    next();
  } catch (error) {
    logger.warn("Validation failed", { errors: error.errors, path: req.path });
    return res.status(400).json({
      success: false,
      message: "Validation Error",
      errors: error.errors.map((e) => ({
        path: e.path.join("."),
        message: e.message,
      })),
    });
  }
};

module.exports = validate;
