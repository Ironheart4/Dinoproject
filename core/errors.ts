export class AppError extends Error {
  readonly statusCode: number;
  readonly body: Record<string, unknown>;

  constructor(statusCode: number, message: string, extra: Record<string, unknown> = {}) {
    super(message);
    this.name = "AppError";
    this.statusCode = statusCode;
    this.body = { error: message, ...extra };
  }
}

export class BadRequestError extends AppError {
  constructor(message: string, extra: Record<string, unknown> = {}) {
    super(400, message, extra);
    this.name = "BadRequestError";
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string, extra: Record<string, unknown> = {}) {
    super(401, message, extra);
    this.name = "UnauthorizedError";
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string, extra: Record<string, unknown> = {}) {
    super(403, message, extra);
    this.name = "ForbiddenError";
  }
}

export class NotFoundError extends AppError {
  constructor(message: string, extra: Record<string, unknown> = {}) {
    super(404, message, extra);
    this.name = "NotFoundError";
  }
}

export class ConflictError extends AppError {
  constructor(message: string, extra: Record<string, unknown> = {}) {
    super(409, message, extra);
    this.name = "ConflictError";
  }
}

export class ServiceUnavailableError extends AppError {
  constructor(message: string, extra: Record<string, unknown> = {}) {
    super(503, message, extra);
    this.name = "ServiceUnavailableError";
  }
}

export class InternalError extends AppError {
  constructor(message: string, extra: Record<string, unknown> = {}) {
    super(500, message, extra);
    this.name = "InternalError";
  }
}
