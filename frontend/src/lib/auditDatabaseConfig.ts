import path from 'path';

/** Mirrors engine/config.py's AI_AUDIT_DB_PATH resolution. This is a
 * separate, writable database the engine owns — the frontend only ever
 * opens it read-only, for the model-usage readout. */
export function getAuditDatabasePath(): string {
  const configured = process.env.AI_AUDIT_DB_PATH;
  if (!configured) {
    return path.resolve(/* turbopackIgnore: true */ process.cwd(), '../database/audit.db');
  }
  if (path.isAbsolute(configured)) return configured;
  return path.resolve(/* turbopackIgnore: true */ process.cwd(), '..', configured);
}
