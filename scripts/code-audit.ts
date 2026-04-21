/**
 * ARISE CODE AUDITOR v9.0
 * Herramienta de análisis estático para detectar inconsistencias en el código base
 *
 * Ejecución: bun run scripts/code-audit.ts
 */

import { readdir, readFile } from 'fs/promises';
import { join, extname } from 'path';

// Configuración
const SKIP_DIRS = ['node_modules', '.git', '.next', '.claude', 'public', 'scratch', 'scripts'];
const SKIP_FILES = ['test_pdf_sender.js', 'test_whatsapp.js', 'test_engine.js', 'scratch_audit.js'];
const TARGET_EXTENSIONS = ['.ts', '.tsx', '.js', '.jsx'];

// Patrones de inconsistencia a detectar
const AUDIT_PATTERNS = {
  versionInconsistency: {
    // Detectar SOLO versiones v7.x y v8.x (v9.0 es la correcta)
    pattern: /Diamond\s*v?(?:7|8)\.\d+|v[78]\.\d+(?:\.\d+)?/gi,
    description: 'Versiones obsoletas del protocolo (debe ser v9.0)',
    severity: 'HIGH',
    // Ignorar matches dentro de strings de clase CSS
    skipIfContains: ['arise-card', 'shadow-arise', 'arise_', 'graph.facebook.com', 'Diamond v9', 'Diamond v9.0']
  },
  hardcodedLocalhost: {
    pattern: /http:\/\/localhost:\d+/g,
    description: 'URL localhost hardcoded (no production-ready)',
    severity: 'HIGH'
  },
  supabaseKeyVariants: {
    pattern: /(?:SUPABASE_|ARISE_)(?:SERVICE_ROLE_KEY|ANON_KEY|PUBLISHABLE_KEY)/g,
    description: 'Variantes de nombres de variables Supabase',
    severity: 'MEDIUM'
  },
  consoleLog: {
    pattern: /console\.(log|error|warn)/g,
    description: 'Console logs en producción',
    severity: 'LOW'
  },
  anyType: {
    pattern: /:\s*any\b/g,
    description: 'Uso de tipo `any` (TypeScript)',
    severity: 'MEDIUM'
  },
  todoComments: {
    pattern: /(?:TODO|FIXME|XXX|HACK):/gi,
    description: 'Comentarios técnicos pendientes',
    severity: 'LOW'
  },
  magicNumbers: {
    pattern: /(?:if\s*\(\s*\w+\s*[<>=]+\s*)(\d{4,})/g,
    description: 'Números mágicos en comparaciones',
    severity: 'LOW'
  },
  hardcodedPhoneIds: {
    pattern: /(?:phone_number_id|phone_number|wa_id|WABA|Phone):\s*['"]?\d{10,}/gi,
    description: 'IDs de teléfono/WhatsApp hardcoded',
    severity: 'HIGH'
  }
};

interface Finding {
  file: string;
  line: number;
  column: number;
  pattern: string;
  description: string;
  severity: 'HIGH' | 'MEDIUM' | 'LOW';
  snippet: string;
}

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

function getLineInfo(content: string, index: number): { line: number; column: number; snippet: string } {
  const lines = content.substring(0, index).split('\n');
  const line = lines.length;
  const column = lines[lines.length - 1].length + 1;

  // Obtener snippet (línea completa)
  const allLines = content.split('\n');
  const snippet = allLines[line - 1]?.trim() || '';

  return { line, column, snippet };
}

async function auditFile(filePath: string): Promise<Finding[]> {
  const findings: Finding[] = [];

  try {
    const content = await readFile(filePath, 'utf-8');
    const relativePath = filePath.replace(process.cwd() + '\\', '').replace(/\\/g, '/');

    for (const [key, config] of Object.entries(AUDIT_PATTERNS)) {
      const regex = new RegExp(config.pattern.source, config.pattern.flags);
      let match;

      while ((match = regex.exec(content)) !== null) {
        const { line, column, snippet } = getLineInfo(content, match.index);

        // Filtrar falsos positivos
        if (key === 'hardcodedLocalhost' && snippet.includes('//')) continue;
        if (key === 'consoleLog' && snippet.includes('//')) continue;

        // Filtrar versiones en clases CSS (arise-card, shadow-arise, etc.)
        if (key === 'versionInconsistency') {
          const skipConfig = config as any;
          if (skipConfig.skipIfContains) {
            const shouldSkip = skipConfig.skipIfContains.some((s: string) => snippet.includes(s));
            if (shouldSkip) continue;
          }
        }

        findings.push({
          file: relativePath,
          line,
          column,
          pattern: match[0],
          description: config.description,
          severity: config.severity as 'HIGH' | 'MEDIUM' | 'LOW',
          snippet
        });
      }
    }
  } catch (error) {
    // Ignorar archivos no legibles
  }

  return findings;
}

function printReport(findings: Finding[]) {
  console.log('\n' + '='.repeat(80));
  console.log('🔍 ARISE CODE AUDITOR v9.0 - REPORTE DE AUDITORÍA');
  console.log('='.repeat(80));

  const bySeverity = {
    HIGH: findings.filter(f => f.severity === 'HIGH'),
    MEDIUM: findings.filter(f => f.severity === 'MEDIUM'),
    LOW: findings.filter(f => f.severity === 'LOW')
  };

  console.log(`\n📊 RESUMEN: ${findings.length} hallazgos`);
  console.log(`   🔴 HIGH:   ${bySeverity.HIGH.length}`);
  console.log(`   🟡 MEDIUM: ${bySeverity.MEDIUM.length}`);
  console.log(`   🟢 LOW:    ${bySeverity.LOW.length}`);

  if (findings.length === 0) {
    console.log('\n✅ ¡No se encontraron inconsistencias!');
    return;
  }

  // Imprimir hallazgos HIGH primero
  if (bySeverity.HIGH.length > 0) {
    console.log('\n' + '─'.repeat(80));
    console.log('🔴 HALLAZGOS DE ALTA PRIORIDAD');
    console.log('─'.repeat(80));

    for (const finding of bySeverity.HIGH) {
      console.log(`\n📁 ${finding.file}:${finding.line}`);
      console.log(`   ${finding.description}`);
      console.log(`   Found: "${finding.pattern}"`);
      console.log(`   ${finding.snippet.substring(0, 80)}...`);
    }
  }

  // Imprimir hallazgos MEDIUM
  if (bySeverity.MEDIUM.length > 0) {
    console.log('\n' + '─'.repeat(80));
    console.log('🟡 HALLAZGOS DE PRIORIDAD MEDIA');
    console.log('─'.repeat(80));

    for (const finding of bySeverity.MEDIUM) {
      console.log(`\n📁 ${finding.file}:${finding.line}`);
      console.log(`   ${finding.description}`);
      console.log(`   Found: "${finding.pattern}"`);
    }
  }

  // Imprimir hallazgos LOW
  if (bySeverity.LOW.length > 0) {
    console.log('\n' + '─'.repeat(80));
    console.log('🟢 HALLAZGOS DE BAJA PRIORIDAD');
    console.log('─'.repeat(80));

    for (const finding of bySeverity.LOW) {
      console.log(`\n📁 ${finding.file}:${finding.line}`);
      console.log(`   ${finding.description}`);
      console.log(`   Found: "${finding.pattern}"`);
    }
  }

  console.log('\n' + '='.repeat(80));
  console.log('Fin del reporte');
  console.log('='.repeat(80) + '\n');
}

async function main() {
  console.log('🔍 ARISE CODE AUDITOR v9.0 - Escaneando código base...');

  const startTime = Date.now();
  const rootDir = process.cwd();

  // Obtener todos los archivos
  const files = await walkDir(rootDir);
  console.log(`📂 ${files.length} archivos encontrados`);

  // Auditar cada archivo
  const allFindings: Finding[] = [];

  for (const file of files) {
    const findings = await auditFile(file);
    // Filtrar archivos de test en la raíz
    const fileName = file.split(/[\\/]/).pop() || '';
    if (SKIP_FILES.some(skip => fileName.includes(skip))) continue;
    allFindings.push(...findings);
  }

  // Imprimir reporte
  printReport(allFindings);

  const duration = ((Date.now() - startTime) / 1000).toFixed(2);
  console.log(`⏱️  Auditoría completada en ${duration}s`);

  // Exit con código de error si hay hallazgos HIGH
  const highCount = allFindings.filter(f => f.severity === 'HIGH').length;
  if (highCount > 0) {
    process.exit(1);
  }
}

main().catch(console.error);
