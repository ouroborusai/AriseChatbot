/**
 * ARISE AUTO-CLEANUP TOOL v9.0
 * Corrige automáticamente inconsistencias detectadas en el código base
 *
 * Ejecución: npx tsx scripts/auto-cleanup.ts
 */

import { readdir, readFile, writeFile } from 'fs/promises';
import { join, extname } from 'path';

const SKIP_DIRS = ['node_modules', '.git', '.next', '.claude', 'public', 'scratch', 'scripts'];
const TARGET_EXTENSIONS = ['.ts', '.tsx', '.js', '.jsx'];

interface CleanupRule {
  name: string;
  pattern: RegExp;
  replacement: string | ((match: string) => string);
  description: string;
  skipIfContains?: string[];
}

const CLEANUP_RULES: CleanupRule[] = [
  {
    name: 'Diamond Version Unification',
    pattern: /Diamond\s*v?(?:7|8)\.\d+|v[78]\.\d+(?:\.\d+)?/gi,
    replacement: 'Diamond v9.0',
    description: 'Unifica versiones de protocolo a v9.0',
    skipIfContains: ['arise-card', 'shadow-arise', 'arise_', 'Diamond v9']
  },
  {
    name: 'Facebook API Version Update',
    pattern: /graph\.facebook\.com\/v18\.0/g,
    replacement: 'graph.facebook.com/v19.0',
    description: 'Actualiza API de WhatsApp a v19.0'
  },
  {
    name: 'Console Log Cleanup (Opcional)',
    pattern: /console\.(log|debug)/g,
    replacement: '// console.$1',
    description: 'Comenta console.log/debug en producción',
    skipIfContains: ['// console.']
  }
];

async function walkDir(dir: string): Promise<string[]> {
  const files: string[] = [];

  try {
    const entries = await readdir(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = join(dir, entry.name);

      if (entry.isDirectory()) {
        if (!SKIP_DIRS.includes(entry.name)) {
          files.push(...await walkDir(fullPath));
        }
      } else if (TARGET_EXTENSIONS.includes(extname(entry.name))) {
        files.push(fullPath);
      }
    }
  } catch (error) {
    // Ignorar errores de permisos
  }

  return files;
}

async function applyCleanupRules(filePath: string): Promise<{ changed: boolean; changes: string[] }> {
  const content = await readFile(filePath, 'utf-8');
  let newContent = content;
  const changes: string[] = [];

  for (const rule of CLEANUP_RULES) {
    const matches = newContent.match(rule.pattern);
    if (matches && matches.length > 0) {
      const uniqueMatches = [...new Set(matches)];

      for (const match of uniqueMatches) {
        // Skip si coincide con skipIfContains
        if (rule.skipIfContains) {
          const shouldSkip = rule.skipIfContains.some(s => match.includes(s));
          if (shouldSkip) continue;
        }

        const replacement = typeof rule.replacement === 'string'
          ? rule.replacement
          : rule.replacement(match);

        // Verificar que el reemplazo sea diferente
        if (match !== replacement) {
          newContent = newContent.replace(new RegExp(escapeRegex(match), 'g'), replacement);
          changes.push(`${rule.name}: "${match}" → "${replacement}"`);
        }
      }
    }
  }

  const changed = content !== newContent;

  if (changed) {
    await writeFile(filePath, newContent, 'utf-8');
  }

  return { changed, changes };
}

function escapeRegex(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

async function main() {
  console.log('🧹 ARISE AUTO-CLEANUP v9.0 - Corrigiendo inconsistencias...\n');

  const startTime = Date.now();
  const files = await walkDir(process.cwd());

  console.log(`📂 ${files.length} archivos escaneados\n`);

  const results = {
    changed: 0,
    unchanged: 0,
    totalChanges: 0,
    files: [] as { file: string; changes: string[] }[]
  };

  for (const file of files) {
    const { changed, changes } = await applyCleanupRules(file);

    if (changed && changes.length > 0) {
      results.changed++;
      results.totalChanges += changes.length;
      results.files.push({
        file: file.replace(process.cwd() + '\\', '').replace(/\\/g, '/'),
        changes
      });
    } else {
      results.unchanged++;
    }
  }

  // Imprimir reporte
  console.log('═'.repeat(80));
  console.log('📊 REPORTE DE LIMPIEZA');
  console.log('═'.repeat(80));
  console.log(`\n✅ Archivos modificados: ${results.changed}`);
  console.log(`⏸️  Archivos sin cambios: ${results.unchanged}`);
  console.log(`🔧 Total de correcciones: ${results.totalChanges}\n`);

  if (results.files.length > 0) {
    console.log('─'.repeat(80));
    console.log('📝 DETALLE DE CAMBIOS\n');

    for (const result of results.files) {
      console.log(`📁 ${result.file}`);
      for (const change of result.changes) {
        console.log(`   ↳ ${change}`);
      }
      console.log();
    }
  }

  const duration = ((Date.now() - startTime) / 1000).toFixed(2);
  console.log('═'.repeat(80));
  console.log(`⏱️  Cleanup completado en ${duration}s\n`);
}

main().catch(console.error);

