import path from 'path';

export function getDatabasePath(): string {
  const configured = process.env.MEDORCH_DB_PATH;
  if (!configured) {
    return path.resolve(/* turbopackIgnore: true */ process.cwd(), '../database/medorch.db');
  }
  if (path.isAbsolute(configured)) return configured;
  return path.resolve(/* turbopackIgnore: true */ process.cwd(), '..', configured);
}
