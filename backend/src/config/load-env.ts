import { existsSync, readFileSync } from 'node:fs';

let loaded = false;

function applyEnvFile(path: string): void {
  const text = readFileSync(path, 'utf8');
  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) {
      continue;
    }
    const separator = trimmed.indexOf('=');
    if (separator === -1) {
      continue;
    }
    const key = trimmed.slice(0, separator).trim();
    let value = trimmed.slice(separator + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (key && process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
}

export function loadEnv(): void {
  if (loaded) {
    return;
  }
  loaded = true;
  for (const file of ['.env.local', '.env']) {
    if (existsSync(file)) {
      applyEnvFile(file);
    }
  }
}
