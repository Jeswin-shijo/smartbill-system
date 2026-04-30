function errorHandler(error, _req, res, _next) {
  const statusCode = error.statusCode || 500;
  const message = error.message || 'Something went wrong.';

  if (statusCode >= 500) {
    console.error(error);
  }

  res.status(statusCode).json({ message });
}

module.exports = {
  errorHandler,
};
