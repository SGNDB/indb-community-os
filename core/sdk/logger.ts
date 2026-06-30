const LOG_LEVELS = ["debug", "info", "warn", "error"] as const;
type LogLevel = (typeof LOG_LEVELS)[number];

function shouldLog(level: LogLevel): boolean {
  if (typeof window === "undefined") return true;
  try {
    const stored = sessionStorage.getItem("logLevel") ?? "info";
    return LOG_LEVELS.indexOf(level) >= LOG_LEVELS.indexOf(stored as LogLevel);
  } catch {
    return true;
  }
}

function formatMessage(pluginId: string, level: LogLevel, message: string, data?: unknown): string {
  const timestamp = new Date().toISOString();
  const prefix = `[${timestamp}] [${pluginId}] [${level.toUpperCase()}]`;
  return data ? `${prefix} ${message} ${JSON.stringify(data)}` : `${prefix} ${message}`;
}

export function createLogger(pluginId: string) {
  return {
    debug(message: string, data?: unknown) {
      if (shouldLog("debug")) console.debug(formatMessage(pluginId, "debug", message, data));
    },
    info(message: string, data?: unknown) {
      if (shouldLog("info")) console.info(formatMessage(pluginId, "info", message, data));
    },
    warn(message: string, data?: unknown) {
      if (shouldLog("warn")) console.warn(formatMessage(pluginId, "warn", message, data));
    },
    error(message: string, data?: unknown) {
      if (shouldLog("error")) console.error(formatMessage(pluginId, "error", message, data));
    },
  };
}

export type SDKLogger = ReturnType<typeof createLogger>;
