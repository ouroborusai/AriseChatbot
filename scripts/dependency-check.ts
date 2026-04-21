/**
 * ARISE DEPENDENCY CHECKER v9.0
 * Verifica que todos los imports y dependencias estén correctamente configurados
 *
 * Ejecución: bun run scripts/dependency-check.ts
 */

import { readdir, readFile } from 'fs/promises';
import { join, extname, dirname, resolve } from 'path';
import { existsSync } from 'fs';

const SKIP_DIRS = ['node_modules', '.git', '.next', '.claude', 'public', 'scripts', 'scratch'];
const TARGET_EXTENSIONS = ['.ts', '.tsx', '.js', '.jsx'];

interface ImportInfo {
  file: string;
  importPath: string;
  line: number;
  isExternal: boolean;
  resolvedPath?: string;
  exists: boolean;
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

function extractImports(content: string, filePath: string): ImportInfo[] {
  const imports: ImportInfo[] = [];
  const lines = content.split('\n');

  // Patrones de import
  const importRegex = /(?:import\s+.*?\s+from\s+['"](.+?)['"]|import\s+['"](.+?)['"])/g;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    let match;

    // Reset regex
    importRegex.lastIndex = 0;

    while ((match = importRegex.exec(line)) !== null) {
      const importPath = match[1] || match[2];
      if (!importPath) continue;

      const isExternal = !importPath.startsWith('.') && !importPath.startsWith('/');

      imports.push({
        file: filePath,
        importPath,
        line: i + 1,
        isExternal,
        exists: true // Se valida después
      });
    }
  }

  return imports;
}

function resolveImportPath(importPath: string, fromFile: string): string | null {
  // Imports externos no se resuelven
  if (!importPath.startsWith('.') && !importPath.startsWith('/')) {
    return null;
  }

  const dir = dirname(fromFile);
  let resolved = resolve(dir, importPath);

  // Intentar extensiones
  const extensions = ['', '.ts', '.tsx', '.js', '.jsx', '/index.ts', '/index.tsx', '/index.js', '/index.jsx'];

  for (const ext of extensions) {
    const candidate = resolved + ext;
    if (existsSync(candidate)) {
      return candidate;
    }
  }

  return resolved; // Retornar aunque no exista para reportar el error
}

async function checkPackageJson(): Promise<{ missing: string[]; unused: string[] }> {
  const packageJsonPath = join(process.cwd(), 'package.json');

  try {
    const content = await readFile(packageJsonPath, 'utf-8');
    const pkg = JSON.parse(content);

    const dependencies = {
      ...pkg.dependencies,
      ...pkg.devDependencies
    };

    const depNames = Object.keys(dependencies);
    const usedDeps = new Set<string>();

    // Buscar imports externos en todos los archivos
    const files = await walkDir(process.cwd());

    for (const file of files) {
      const content = await readFile(file, 'utf-8');
      const imports = extractImports(content, file);

      for (const imp of imports) {
        if (imp.isExternal) {
          // Extraer nombre del paquete (ej: @supabase/ssr -> @supabase/ssr)
          const pkgName = imp.importPath.split('/')[0]?.startsWith('@')
            ? imp.importPath.split('/').slice(0, 2).join('/')
            : imp.importPath.split('/')[0];

          if (pkgName) {
            usedDeps.add(pkgName);
          }
        }
      }
    }

    // Dependencias no usadas
    const unused = depNames.filter(dep => !usedDeps.has(dep));

    // Dependencias faltantes (usadas pero no instaladas)
    const missing = Array.from(usedDeps).filter(dep => !depNames.includes(dep));

    return { missing, unused };
  } catch (error) {
    return { missing: [], unused: [] };
  }
}

function printReport(
  brokenImports: ImportInfo[],
  packageReport: { missing: string[]; unused: string[] }
) {
  console.log('\n' + '='.repeat(80));
  console.log('🔗 ARISE DEPENDENCY CHECKER v9.0 - REPORTE');
  console.log('='.repeat(80));

  // Broken imports
  console.log(`\n📁 IMPORTS ROTOS: ${brokenImports.length}`);

  if (brokenImports.length > 0) {
    for (const imp of brokenImports) {
      console.log(`\n   🔴 ${imp.file}:${imp.line}`);
      console.log(`      import ... from '${imp.importPath}'`);
      console.log(`      → Archivo no encontrado: ${imp.resolvedPath}`);
    }
  } else {
    console.log('   ✅ No hay imports rotos');
  }

  // Package.json issues
  console.log('\n📦 DEPENDENCIAS DE PACKAGE.JSON');
  console.log('─'.repeat(80));

  if (packageReport.missing.length > 0) {
    console.log(`\n   🔴 FALTANTES (usadas pero no instaladas): ${packageReport.missing.length}`);
    for (const dep of packageReport.missing) {
      console.log(`      - ${dep}`);
    }
  } else {
    console.log('   ✅ No faltan dependencias');
  }

  if (packageReport.unused.length > 0) {
    console.log(`\n   🟡 SIN USO (instaladas pero no importadas): ${packageReport.unused.length}`);
    for (const dep of packageReport.unused.slice(0, 20)) {
      console.log(`      - ${dep}`);
    }
    if (packageReport.unused.length > 20) {
      console.log(`      ... y ${packageReport.unused.length - 20} más`);
    }
  } else {
    console.log('   ✅ Todas las dependencias están en uso');
  }

  console.log('\n' + '='.repeat(80) + '\n');
}

async function main() {
  console.log('🔗 ARISE DEPENDENCY CHECKER v9.0 - Verificando imports...');

  const startTime = Date.now();
  const files = await walkDir(process.cwd());
  console.log(`📂 ${files.length} archivos analizados`);

  const allImports: ImportInfo[] = [];

  // Extraer todos los imports
  for (const file of files) {
    const content = await readFile(file, 'utf-8');
    const imports = extractImports(content, file);
    allImports.push(...imports);
  }

  console.log(`🔗 ${allImports.length} imports encontrados`);

  // Resolver y validar imports internos
  const brokenImports: ImportInfo[] = [];

  for (const imp of allImports) {
    if (!imp.isExternal) {
      imp.resolvedPath = resolveImportPath(imp.importPath, imp.file);
      imp.exists = imp.resolvedPath ? existsSync(imp.resolvedPath) : false;

      if (!imp.exists) {
        brokenImports.push(imp);
      }
    }
  }

  // Verificar package.json
  const packageReport = await checkPackageJson();

  // Imprimir reporte
  printReport(brokenImports, packageReport);

  const duration = ((Date.now() - startTime) / 1000).toFixed(2);
  console.log(`⏱️  Verificación completada en ${duration}s`);

  // Exit con código de error si hay problemas críticos
  if (brokenImports.length > 0 || packageReport.missing.length > 0) {
    process.exit(1);
  }
}

main().catch(console.error);
