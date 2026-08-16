import fs from 'node:fs';
import vm from 'node:vm';

const files = fs.readdirSync('.').filter((f) => f.endsWith('.html'));
let failed = false;

for (const file of files) {
  const html = fs.readFileSync(file, 'utf8');
  const ids = [...html.matchAll(/\bid=["']([^"']+)["']/g)].map((m) => m[1]);
  const duplicateIds = [...new Set(ids.filter((id, i) => ids.indexOf(id) !== i))];
  if (duplicateIds.length) {
    console.error(`${file}: duplicate id(s): ${duplicateIds.join(', ')}`);
    failed = true;
  }

  const scripts = [...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/gi)]
    .map((m) => m[1])
    .filter((code) => code.trim());

  scripts.forEach((code, index) => {
    try {
      new vm.Script(code, { filename: `${file}:inline-script-${index + 1}` });
    } catch (error) {
      console.error(error instanceof Error ? error.message : String(error));
      failed = true;
    }
  });

  const opens = (html.match(/<script\b/gi) || []).length;
  const closes = (html.match(/<\/script>/gi) || []).length;
  if (opens !== closes) {
    console.error(`${file}: script tag count mismatch (${opens} open / ${closes} close)`);
    failed = true;
  }

  console.log(`${file}: checked ${scripts.length} inline script(s), ${ids.length} id(s)`);
}

if (failed) process.exit(1);
console.log(`Validated ${files.length} HTML file(s).`);
