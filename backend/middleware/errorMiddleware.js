const notFound = (req, res, next) => {
  const error = new Error(`Not Found - ${req.originalUrl}`);
  console.log(`Not Found - ${req.originalUrl}`); // Add this line for debugging
  res.status(404);
  next(error);
};

const errorHandler = (err, req, res, next) => {
  const statusCode = res.statusCode === 200 ? err.status || 500 : res.statusCode;
  res.status(statusCode);
  if (statusCode >= 500) console.error(err);
  res.json({
    message: statusCode >= 500 ? 'Something went wrong' : err.message,
  });
};

module.exports = { notFound, errorHandler };
