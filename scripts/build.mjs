import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const root = new URL('../', import.meta.url);
export const sources = [
  'config.js',
  'shared.js',
  'styles.js',
  'settings.js',
  'regional-prices.js',
  'conversion.js',
  'family-library.js',
  'cart-tools.js',
  'friend-tools.js',
  'main.js'
];

export async function build() {
  const metadata = await readFile(new URL('src/metadata.txt', root), 'utf8');
  const modules = await Promise.all(sources.map(async name => {
    const content = await readFile(new URL('src/' + name, root), 'utf8');
    return `  // ---- ${name} ----\n` + content.trimEnd();
  }));
  return metadata.trimEnd() + "\n\n(function () {\n  'use strict';\n\n" + modules.join('\n\n') + '\n})();\n';
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const output = new URL('Steam Store Enhancer.user.js', root);
  const generated = await build();
  if (process.argv.includes('--check')) {
    const existing = await readFile(output, 'utf8');
    if (existing.replace(/\r\n/g, '\n') !== generated) {
      console.error('安装脚本与源码不一致，请运行 npm run build。');
      process.exitCode = 1;
    }
  } else {
    await writeFile(output, generated);
    console.log('已生成 Steam Store Enhancer.user.js');
  }
}
