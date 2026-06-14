import { validationResult } from 'express-validator';

/**
 * Collect express-validator results and respond 400 with a tidy error list.
 * Place after the validation chain on a route.
 */
export function handleValidation(req, res, next) {
  const result = validationResult(req);
  if (result.isEmpty()) return next();
  return res.status(400).json({
    error: 'Napaka pri validaciji vnosa.',
    details: result.array().map((e) => ({ field: e.path, message: e.msg })),
  });
}
