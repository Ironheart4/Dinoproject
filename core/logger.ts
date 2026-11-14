type LogLevel = "debug" | "info" | "warn" | "error";

function write(level: LogLevel, message: string, meta?: unknown): void {
  const entry = {
    level,
    message,
    time: new Date().toISOString(),
    ...(meta !== undefined ? { meta } : {}),
  };
  const line = JSON.stringify(entry);
  if (level === "error") console.error(line);
  else if (level === "warn") console.warn(line);
  else console.log(line);
}

export const logger = {
  debug: (message: string, meta?: unknown) => write("debug", message, meta),
  info: (message: string, meta?: unknown) => write("info", message, meta),
  warn: (message: string, meta?: unknown) => write("warn", message, meta),
  error: (message: string, meta?: unknown) => write("error", message, meta),
};
