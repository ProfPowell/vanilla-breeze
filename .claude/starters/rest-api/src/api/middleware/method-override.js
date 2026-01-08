/**
 * @file Method Override Middleware
 * @description Supports PUT/PATCH/DELETE via POST with _method field
 * Enables progressive enhancement for HTML forms
 */

/**
 * @typedef {import('express').Request} Request
 * @typedef {import('express').Response} Response
 * @typedef {import('express').NextFunction} NextFunction
 */

/** @type {readonly string[]} */
const ALLOWED_METHODS = ['PUT', 'PATCH', 'DELETE'];

/**
 * Override HTTP method based on _method field in body
 * Allows HTML forms to submit PUT/PATCH/DELETE requests via POST
 * @param {Request} req - Express request
 * @param {Response} res - Express response
 * @param {NextFunction} next - Next middleware
 * @returns {void}
 */
export function methodOverride(req, res, next) {
  if (req.method === 'POST' && req.body?._method) {
    const method = String(req.body._method).toUpperCase();
    if (ALLOWED_METHODS.includes(method)) {
      req.method = method;
      delete req.body._method;
    }
  }
  next();
}