module.exports = function validate(schemas) {
  return (req, res, next) => {
    const errors = [];

    for (const key of ['body', 'params', 'query']) {
      if (!schemas[key]) continue;
      const result = schemas[key].safeParse(req[key]);
      if (result.success) {
        req[key] = result.data;
      } else {
        errors.push(...result.error.issues.map((issue) => ({
          field: [key, ...issue.path].join('.'),
          message: issue.message
        })));
      }
    }

    if (errors.length > 0) {
      return res.status(400).json({ message: 'Validation failed', errors });
    }
    return next();
  };
};
