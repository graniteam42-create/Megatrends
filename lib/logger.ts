// Tiny structured logger. JSON in production, pretty in dev.
// Avoids pulling in a runtime dependency like pino/winston.

type Level = "debug" | "info" | "warn" | "error";
type Fields = Record<string, unknown>;

const LEVELS: Record<Level, number> = { debug: 10, info: 20, warn: 30, error: 40 };

function currentMinLevel(): number {
  const raw = (process.env.LOG_LEVEL || "").toLowerCase() as Level;
  if (raw in LEVELS) return LEVELS[raw];
  return process.env.NODE_ENV === "production" ? LEVELS.info : LEVELS.debug;
}

function emit(level: Level, msg: string, fields?: Fields) {
  if (LEVELS[level] < currentMinLevel()) return;
  const record = {
    ts: new Date().toISOString(),
    level,
    msg,
    ...(fields ?? {}),
  };

  // In production, a single JSON line per log — friendly to log aggregators.
  if (process.env.NODE_ENV === "production") {
    // eslint-disable-next-line no-console
    console[level === "debug" ? "log" : level](JSON.stringify(record));
    return;
  }

  const prefix = `[${record.ts}] ${level.toUpperCase()}`;
  if (fields && Object.keys(fields).length) {
    // eslint-disable-next-line no-console
    console[level === "debug" ? "log" : level](`${prefix} ${msg}`, fields);
  } else {
    // eslint-disable-next-line no-console
    console[level === "debug" ? "log" : level](`${prefix} ${msg}`);
  }
}

export const logger = {
  debug: (msg: string, fields?: Fields) => emit("debug", msg, fields),
  info: (msg: string, fields?: Fields) => emit("info", msg, fields),
  warn: (msg: string, fields?: Fields) => emit("warn", msg, fields),
  error: (msg: string, fields?: Fields) => emit("error", msg, fields),
};
