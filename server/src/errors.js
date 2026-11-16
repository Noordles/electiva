export class HttpError extends Error {
  constructor(status, code, message) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

export function errorHandler(error, request, response, next) {
  if (response.headersSent) return next(error);
  let status = 500;
  let code = "internal_error";
  let message = "An unexpected error occurred";
  if (error instanceof HttpError) {
    ({ status, code } = error);
    message = error.message;
  } else if (error.type === "entity.parse.failed") {
    status = 400; code = "invalid_json"; message = "Request body must be valid JSON";
  } else if (error.type === "entity.too.large") {
    status = 413; code = "body_too_large"; message = "Request body exceeds the limit";
  } else if (error.type === "charset.unsupported" || error.type === "encoding.unsupported") {
    status = 415; code = "unsupported_encoding"; message = "Unsupported request encoding";
  } else if (error instanceof URIError) {
    status = 400; code = "invalid_path"; message = "Invalid resource path";
  }
  return response.status(status).json({ error: { code, message, requestId: request.requestId } });
}
