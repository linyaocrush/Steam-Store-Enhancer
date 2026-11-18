import { readFile } from 'node:fs/promises';

export async function loggingSource() {
  return (await Promise.all(['policy', 'format', 'service', 'index'].map(name =>
    readFile(new URL(`../../src/logging/${name}.js`, import.meta.url), 'utf8')))).join('\n');
}
