function notFound(req, res) {
  res.status(404).json({ message: 'API route not found' });
}

function errorHandler(error, req, res, next) {
  if (res.headersSent) return next(error);

  if (error.status) {
    return res.status(error.status).json({ message: error.message });
  }

  if (error.code === '23505') {
    return res.status(409).json({ message: 'A record with those values already exists' });
  }

  if (error.code === '23503') {
    return res.status(409).json({ message: 'The record is in use or references invalid data' });
  }

  return res.status(500).json({ message: 'Internal server error' });
}

module.exports = { notFound, errorHandler };
