/**
 * Vérifie que chaque icône Lucide utilisée dans les templates (name="...")
 * est bien déclarée dans LucideAngularModule.pick() de app.module.ts.
 *
 * Node.js pur — aucune dépendance externe.
 */

'use strict';

const fs   = require('fs');
const path = require('path');

const FRONT_ROOT  = path.resolve(__dirname, '..');
const SRC_DIR     = path.join(FRONT_ROOT, 'src');
const MODULE_FILE = path.join(SRC_DIR, 'app', 'app.module.ts');

// ── Helpers ──────────────────────────────────────────────────────────────────

/** PascalCase → kebab-case conforme Lucide (ShieldX→shield-x, Loader2→loader-2, X→x) */
function toKebab(name) {
  return name
    .replace(/([A-Z])/g, m => '-' + m.toLowerCase()) // majuscule → -minuscule
    .replace(/([a-z])([0-9])/g, '$1-$2')             // chiffre après lettre → tiret
    .replace(/^-/, '');                               // retire le tiret initial
}

/** Collecte récursivement tous les fichiers .ts et .html sous un répertoire. */
function walkSync(dir, exts, acc = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walkSync(full, exts, acc);
    } else if (exts.some(e => entry.name.endsWith(e))) {
      acc.push(full);
    }
  }
  return acc;
}

// ── 1. Lire les icônes déclarées dans LucideAngularModule.pick() ─────────────

const moduleSource = fs.readFileSync(MODULE_FILE, 'utf8');

// Extrait le bloc entre LucideAngularModule.pick({ ... })
const pickMatch = moduleSource.match(/LucideAngularModule\.pick\s*\(\s*\{([\s\S]*?)\}\s*\)/);
if (!pickMatch) {
  console.error('❌  Impossible de trouver LucideAngularModule.pick() dans app.module.ts');
  process.exit(1);
}

const pickBlock = pickMatch[1];

// Extrait les noms de symboles (identifiants JS, alias "X as Y" → garde Y)
const declaredPascal = new Set();
for (const m of pickBlock.matchAll(/\b([A-Z][A-Za-z0-9]*)\b/g)) {
  declaredPascal.add(m[1]);
}

// Convertit en kebab-case
const declaredKebab = new Set([...declaredPascal].map(toKebab));

// ── 2. Collecter toutes les icônes utilisées dans les templates ───────────────

const files = walkSync(SRC_DIR, ['.ts', '.html']);
const usages = new Map(); // kebab → Set<filepath:line>

for (const file of files) {
  const rel  = path.relative(FRONT_ROOT, file);
  const src  = fs.readFileSync(file, 'utf8');
  const lines = src.split('\n');

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    // Cherche <lucide-icon ... name="..." ou [name]="'...'"
    const staticMatches = line.matchAll(/lucide-icon[^>]*\sname="([^"]+)"/g);
    for (const m of staticMatches) {
      const icon = m[1];
      if (!usages.has(icon)) usages.set(icon, new Set());
      usages.get(icon).add(`${rel}:${i + 1}`);
    }
  }
}

// ── 3. Comparer et rapporter ──────────────────────────────────────────────────

const missing = [];
for (const [icon, locs] of [...usages].sort((a, b) => a[0].localeCompare(b[0]))) {
  if (!declaredKebab.has(icon)) {
    missing.push({ icon, locs: [...locs] });
  }
}

if (missing.length === 0) {
  console.log(`✅  Toutes les icônes Lucide sont déclarées (${usages.size} icône(s) vérifiée(s)).`);
  process.exit(0);
} else {
  console.error(`\n❌  ${missing.length} icône(s) Lucide utilisée(s) mais NON déclarée(s) dans app.module.ts :\n`);
  for (const { icon, locs } of missing) {
    console.error(`  • ${icon}`);
    for (const loc of locs.slice(0, 3)) {
      console.error(`      ${loc}`);
    }
    if (locs.length > 3) console.error(`      ... et ${locs.length - 3} autre(s)`);
  }
  console.error('\n  → Ajouter ces icônes à l\'import ET à LucideAngularModule.pick() dans app.module.ts\n');
  process.exit(1);
}
