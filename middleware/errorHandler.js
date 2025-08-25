const errorHandler = (err, req, res, next) => {
  console.error('Error:', err);

  // Default error
  let error = {
    success: false,
    message: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  };

  // Validation error
  if (err.isJoi) {
    error.message = 'Validation Error';
    error.details = err.details.map(detail => ({
      field: detail.path.join('.'),
      message: detail.message
    }));
    return res.status(400).json(error);
  }

  // Firebase errors
  if (err.code) {
    switch (err.code) {
      case 'auth/user-not-found':
        error.message = 'User not found';
        return res.status(404).json(error);
      case 'auth/invalid-email':
        error.message = 'Invalid email address';
        return res.status(400).json(error);
      case 'auth/weak-password':
        error.message = 'Password is too weak';
        return res.status(400).json(error);
      case 'auth/email-already-in-use':
        error.message = 'Email is already registered';
        return res.status(409).json(error);
    }
  }

  // MongoDB/Mongoose errors
  if (err.name === 'ValidationError') {
    error.message = 'Validation Error';
    error.details = Object.values(err.errors).map(val => ({
      field: val.path,
      message: val.message
    }));
    return res.status(400).json(error);
  }

  if (err.name === 'CastError') {
    error.message = 'Invalid ID format';
    return res.status(400).json(error);
  }

  if (err.code === 11000) {
    error.message = 'Duplicate field value';
    return res.status(409).json(error);
  }

  // Default to 500 server error
  res.status(err.statusCode || 500).json(error);
};

module.exports = errorHandler;