/**
 * Vérifie que les valeurs propres à Froid Cheikh ne sont plus codées en dur
 * dans les sources frontend (src/) et backend (src/main/).
 *
 * Node.js pur : fs + path uniquement, pas de grep/execSync, compatible Windows.
 */

const fs = require('fs');
const path = require('path');

// Racine frontend = dossier parent de ce fichier
const FRONT_ROOT = path.resolve(__dirname, '..');
// Racine backend = sibling du projet frontend
const BACK_ROOT = path.resolve(FRONT_ROOT, '..', 'froidCheikhAntaMbacke');

const SCAN_DIRS = [
  path.join(FRONT_ROOT, 'src'),
  path.join(BACK_ROOT, 'src', 'main'),
];

const EXCLUDED_FILES = [
  'DataInitializer.java',
  'check-hardcoded.js',
];

// Fichiers dont on ignore certains patterns (tableau de { file, patterns[] })
const FILE_PATTERN_EXCLUSIONS = [
  // DEFAULT_CONFIG couleurs neutres – pas spécifiques à Froid Cheikh
  { file: 'site-config.interface.ts', patterns: ['Couleur hex en dur (#16a34a)'] },
  // Valeurs par défaut d'entité / service – rôle analogue à DataInitializer
  { file: 'ParametresSite.java',       patterns: ['Couleur hex en dur (#16a34a)'] },
  { file: 'ParametresSiteService.java', patterns: ['Couleur hex en dur (#16a34a)'] },
  // Placeholder de formulaire d'installation (valeur neutre)
  { file: 'install-wizard.component.ts', patterns: ['Couleur hex en dur (#16a34a)'] },
  // Placeholder de formulaire d'administration (valeur neutre)
  { file: 'site-settings.component.ts', patterns: ['Couleur hex en dur (#16a34a)'] },
  // URLs de domaine commentées, non affichées
  { file: 'environment.ts',             patterns: ['Nom boutique en dur'] },
];

// Extensions à analyser
const EXTENSIONS = new Set([
  '.ts', '.html', '.css', '.scss', '.java', '.properties', '.yml', '.yaml', '.json'
]);

// Patterns à détecter
const PATTERNS = [
  { name: 'Nom boutique en dur',              regex: /froid\s+cheikh\s+anta\s+mback[eé]/i },
  { name: 'Téléphone en dur (77 335 20 00)',  regex: /77\s*335\s*20\s*00/i },
  { name: 'Téléphone en dur (76 888 04 42)',  regex: /76\s*888\s*04\s*42/i },
  { name: 'Indicatif+Tél en dur (+221773352000)', regex: /773352000/ },
  { name: 'Indicatif+Tél en dur (+221768880442)', regex: /768880442/ },
  { name: 'Adresse en dur (Ouest Foire)',      regex: /ouest\s*foire/i },
  { name: 'Adresse en dur (Cité Aelmas)',      regex: /c[iî]t[eé]\s*aelmas/i },
  { name: 'Couleur hex en dur (#059669)',      regex: /#059669/i },
  { name: 'Couleur hex en dur (#ef4444)',      regex: /#ef4444/i },
  { name: 'Couleur hex en dur (#10b981)',      regex: /#10b981/i },
  { name: 'Couleur hex en dur (#16a34a)',      regex: /#16a34a/i },
  { name: 'URL Facebook en dur',               regex: /facebook\.com\/froidcheikh/i },
  { name: 'URL Instagram en dur',              regex: /instagram\.com\/froidcheikh/i },
  { name: "Devise 'XOF' en dur (currency pipe)", regex: /currency\s*:\s*['"]XOF['"]/i },
];

// Chemins à ignorer entièrement
const IGNORE_PATH_FRAGMENTS = [
  'node_modules', 'dist', '.angular', 'target', '.git',
];

// Détecte si une ligne est un commentaire (mono ou multiligne)
function isCommentLine(line) {
  const t = line.trim();
  return t.startsWith('//') || t.startsWith('*') || t.startsWith('/*') || t.startsWith('#');
}

function shouldIgnorePath(filePath) {
  return IGNORE_PATH_FRAGMENTS.some(f => filePath.includes(f));
}

function isExcludedFile(filePath) {
  return EXCLUDED_FILES.includes(path.basename(filePath));
}

function getFileExcludedPatterns(filePath) {
  const basename = path.basename(filePath);
  const entry = FILE_PATTERN_EXCLUSIONS.find(e => e.file === basename);
  return entry ? entry.patterns : [];
}

function walkDir(dir, results = []) {
  if (!fs.existsSync(dir)) return results;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (shouldIgnorePath(full)) continue;
    if (entry.isDirectory()) {
      walkDir(full, results);
    } else if (entry.isFile() && EXTENSIONS.has(path.extname(entry.name))) {
      results.push(full);
    }
  }
  return results;
}

function checkFile(filePath) {
  if (isExcludedFile(filePath)) return [];
  let content;
  try {
    content = fs.readFileSync(filePath, 'utf-8');
  } catch {
    return [];
  }
  const excludedPatterns = getFileExcludedPatterns(filePath);
  const lines = content.split('\n');
  const hits = [];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (isCommentLine(line)) continue;
    for (const { name, regex } of PATTERNS) {
      if (excludedPatterns.includes(name)) continue;
      if (regex.test(line)) {
        hits.push({ pattern: name, line: i + 1, text: line.trim().slice(0, 120) });
      }
    }
  }
  return hits;
}

// --- Main ---
let totalHits = 0;
let totalFiles = 0;
const allFiles = SCAN_DIRS.flatMap(dir => walkDir(dir));

for (const file of allFiles) {
  const hits = checkFile(file);
  if (hits.length > 0) {
    totalFiles++;
    totalHits += hits.length;
    const rel = path.relative(FRONT_ROOT, file);
    console.log(`\n[WARN] ${rel}`);
    for (const hit of hits) {
      console.log(`  L${hit.line}  ${hit.pattern}`);
      console.log(`       ${hit.text}`);
    }
  }
}

if (totalHits === 0) {
  console.log('✅  Aucune valeur en dur détectée — LOT 1 + LOT 2 conformes.');
  process.exit(0);
} else {
  console.log(`\n❌  ${totalHits} occurrence(s) dans ${totalFiles} fichier(s) à corriger.`);
  process.exit(1);
}
