import { readFile, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();
const lock = JSON.parse(await readFile(path.join(root, 'package-lock.json'), 'utf8'));
const blocks = ['音序 · 生产依赖开源致谢', '此文件收集当前已安装依赖的许可证与版权声明。课程文字与 SVG 插画为本项目原创。'];
for (const [relative, entry] of Object.entries(lock.packages)) {
  if (!relative.startsWith('node_modules/') || entry.dev || entry.link) continue;
  const directory = path.join(root, relative);
  let files;
  try { files = await readdir(directory); } catch { continue; }
  const packageInfo = JSON.parse(await readFile(path.join(directory, 'package.json'), 'utf8'));
  const licenses = files.filter(name => /^(licen[cs]e|copying|notice)(\.|$)/i.test(name));
  blocks.push(`\n${'='.repeat(72)}\n${packageInfo.name} ${packageInfo.version}\nLicense: ${packageInfo.license ?? entry.license ?? 'See upstream notice'}\n${typeof packageInfo.repository === 'string' ? packageInfo.repository : packageInfo.repository?.url ?? ''}`);
  for (const file of licenses) {
    try { blocks.push(`\n--- ${file} ---\n${await readFile(path.join(directory, file), 'utf8')}`); } catch { /* A license directory is not a text file. */ }
  }
}
await writeFile(path.join(root, 'public', 'third-party-notices.txt'), blocks.join('\n'), 'utf8');
console.log(`Collected notices for ${blocks.filter(block => block.startsWith('\n===')).length} production packages.`);
