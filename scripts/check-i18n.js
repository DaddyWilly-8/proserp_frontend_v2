// Checks that every locale dictionary keeps in step with the default (English) one.
//
//   node scripts/check-i18n.js            # fail on missing keys/files, placeholder mismatches, unwired files
//   node scripts/check-i18n.js --strict   # also fail on values left identical to English
//
// For each file under src/dictionaries/en it requires a counterpart in every other locale with
// the same keys and the same {placeholders}, and requires every dictionary file to be
// referenced from src/app/[lang]/dictionaries.ts, and every English file to be listed in
// src/dictionaries/type.ts.

const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..', 'src');
const dictionariesDir = path.join(root, 'dictionaries');
const loaderPath = path.join(root, 'app', '[lang]', 'dictionaries.ts');
const DEFAULT_LOCALE = 'en';
const strict = process.argv.includes('--strict');

const walk = (dir) =>
  fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    return entry.isDirectory() ? walk(full) : [full];
  });

// A locale is a folder X holding X/X.json (en/en.json, sw/sw.json).
const locales = fs
  .readdirSync(dictionariesDir, { withFileTypes: true })
  .filter((e) => e.isDirectory() && fs.existsSync(path.join(dictionariesDir, e.name, `${e.name}.json`)))
  .map((e) => e.name);

const filesOf = (locale) =>
  walk(path.join(dictionariesDir, locale))
    .filter((f) => f.endsWith('.json'))
    .map((f) => path.relative(path.join(dictionariesDir, locale), f))
    .sort();

// en.json <-> sw.json; every other file keeps its name.
const counterpart = (relativePath, from, to) =>
  relativePath === `${from}.json` ? `${to}.json` : relativePath;

const flatten = (value, prefix = '', out = {}) => {
  for (const key of Object.keys(value)) {
    const next = prefix ? `${prefix}.${key}` : key;
    const child = value[key];
    if (child && typeof child === 'object') flatten(child, next, out);
    else out[next] = child;
  }
  return out;
};

const placeholders = (text) =>
  typeof text === 'string' ? [...text.matchAll(/\{[A-Za-z0-9_]+\}/g)].map((m) => m[0]).sort().join(',') : '';

const read = (locale, relativePath) =>
  JSON.parse(fs.readFileSync(path.join(dictionariesDir, locale, relativePath), 'utf8'));

const errors = [];
const warnings = [];
const loaderSource = fs.readFileSync(loaderPath, 'utf8');
const typeSource = fs.readFileSync(path.join(dictionariesDir, 'type.ts'), 'utf8');
const defaultFiles = filesOf(DEFAULT_LOCALE);

for (const locale of locales) {
  const wired = (relativePath) => loaderSource.includes(`dictionaries/${locale}/${relativePath}`);
  for (const file of filesOf(locale)) {
    if (!wired(file)) errors.push(`[${locale}] ${file} is not imported in dictionaries.ts`);
    if (locale === DEFAULT_LOCALE && !typeSource.includes(`./en/${file}`)) {
      errors.push(`[${locale}] ${file} is not listed in dictionaries/type.ts (components cannot read its keys type-safely)`);
    }
  }
  if (locale === DEFAULT_LOCALE) continue;

  const expected = defaultFiles.map((f) => counterpart(f, DEFAULT_LOCALE, locale));
  for (const file of filesOf(locale)) {
    if (!expected.includes(file)) warnings.push(`[${locale}] ${file} has no English counterpart`);
  }

  for (const defaultFile of defaultFiles) {
    const file = counterpart(defaultFile, DEFAULT_LOCALE, locale);
    if (!fs.existsSync(path.join(dictionariesDir, locale, file))) {
      errors.push(`[${locale}] missing file ${file}`);
      continue;
    }
    const source = flatten(read(DEFAULT_LOCALE, defaultFile));
    const target = flatten(read(locale, file));
    for (const key of Object.keys(source)) {
      if (!(key in target)) {
        errors.push(`[${locale}] ${file}: missing key ${key}`);
        continue;
      }
      if (placeholders(source[key]) !== placeholders(target[key])) {
        errors.push(`[${locale}] ${file}: placeholders differ at ${key} (${placeholders(source[key])} vs ${placeholders(target[key])})`);
      }
      if (typeof source[key] === 'string' && source[key] === target[key] && /[a-z]{4}/i.test(source[key])) {
        warnings.push(`[${locale}] ${file}: ${key} is identical to English ("${source[key]}")`);
      }
    }
    for (const key of Object.keys(target)) {
      if (!(key in source)) warnings.push(`[${locale}] ${file}: extra key ${key} (not in English)`);
    }
  }
}

console.log(`Locales: ${locales.join(', ')} (default: ${DEFAULT_LOCALE})`);
for (const w of warnings) console.warn(`warn  ${w}`);
for (const e of errors) console.error(`error ${e}`);
console.log(`${errors.length} error(s), ${warnings.length} warning(s)`);
process.exit(errors.length || (strict && warnings.length) ? 1 : 0);
