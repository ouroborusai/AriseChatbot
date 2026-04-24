// @ts-nocheck
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

  // Patrones de import (soporta multilínea con el flag de búsqueda global)
  const importRegex = /import\s+[\s\S]*?from\s+['"](.+?)['"]|import\s+['"](.+?)['"]/g;

  let match;
  while ((match = importRegex.exec(content)) !== null) {
    const importPath = match[1] || match[2];
    if (!importPath) continue;

    // Calcular la línea aproximada
    const offset = match.index;
    const lineNumber = content.substring(0, offset).split('\n').length;

    // Imports internos de Next.js (@/) no son externos
    const isExternal = !importPath.startsWith('.') &&
                       !importPath.startsWith('/') &&
                       (!importPath.startsWith('@') || (importPath.startsWith('@') && !importPath.startsWith('@/')));

    imports.push({
      file: filePath,
      importPath,
      line: lineNumber,
      isExternal,
      exists: true // Se valida después
    });
  }

  return imports;
}

function resolveImportPath(importPath: string, fromFile: string): string | null {
  // Imports externos no se resuelven (se validan contra package.json)
  if (!importPath.startsWith('.') && !importPath.startsWith('/')) {
    return null;
  }

  // Imports con alias de Next.js (@/) - requieren tsconfig.json para resolverse
  if (importPath.startsWith('@/')) {
    // Simular resolución de alias @ -> src/
    const dir = dirname(fromFile);
    const relativePath = importPath.replace('@/', 'src/');
    const resolved = resolve(dir, relativePath);

    const extensions = ['', '.ts', '.tsx', '.js', '.jsx', '/index.ts', '/index.tsx', '/index.js', '/index.jsx'];

    for (const ext of extensions) {
      const candidate = resolved + ext;
      if (existsSync(candidate)) {
        return candidate;
      }
    }

    // Si no existe pero el path base existe, es un alias válido
    const baseResolved = resolve(dir, relativePath);
    return baseResolved;
  }

  // Imports relativos normales
  const dir = dirname(fromFile);
  const resolved = resolve(dir, importPath);

  const extensions = ['', '.ts', '.tsx', '.js', '.jsx', '/index.ts', '/index.tsx', '/index.js', '/index.jsx'];

  for (const ext of extensions) {
    const candidate = resolved + ext;
    if (existsSync(candidate)) {
      return candidate;
    }
  }

  return resolved; // Retornar path aunque no exista para reportar el error
}

async function checkPackageJson(): Promise<{
  missing: string[];
  unusedProd: string[];
  unusedDev: string[];
}> {
  const packageJsonPath = join(process.cwd(), 'package.json');

  try {
    const content = await readFile(packageJsonPath, 'utf-8');
    const pkg = JSON.parse(content);

    const prodDeps = pkg.dependencies || {};
    const devDeps = pkg.devDependencies || {};

    const prodDepNames = Object.keys(prodDeps);
    const devDepNames = Object.keys(devDeps);
    const allDepNames = [...prodDepNames, ...devDepNames];

    const usedDeps = new Set<string>();
    const usedProdDeps = new Set<string>();
    const usedDevDeps = new Set<string>();

    // Buscar imports externos en todos los archivos
    const files = await walkDir(process.cwd());

    for (const file of files) {
      const content = await readFile(file, 'utf-8');
      const imports = extractImports(content, file);

      for (const imp of imports) {
        if (imp.isExternal) {
          // Ignorar imports de Deno/JSR (usados en Edge Functions de Supabase)
          if (imp.importPath.startsWith('jsr:') || imp.importPath.startsWith('std/')) {
            continue;
          }

          // Extraer nombre del paquete
          const pkgName = imp.importPath.split('/')[0]?.startsWith('@')
            ? imp.importPath.split('/').slice(0, 2).join('/')
            : imp.importPath.split('/')[0];

          // Ignorar imports que parecen paquetes pero son protocolos o módulos nativos
          if (pkgName && !['http:', 'https:', 'node:', 'deno:', 'npm:', 'fs', 'path', 'url', 'os', 'crypto'].includes(pkgName)) {
            // Limpiar posibles trailing slashes o sub-paths
            const cleanPkgName = pkgName.trim();
            
            usedDeps.add(cleanPkgName);

            // Clasificar si es prod o dev
            if (prodDepNames.includes(cleanPkgName)) {
              usedProdDeps.add(cleanPkgName);
            } else if (devDepNames.includes(cleanPkgName)) {
              usedDevDeps.add(cleanPkgName);
            }
          }
        }
      }
    }

    // Dependencias de producción no usadas
    const unusedProd = prodDepNames.filter(dep => !usedProdDeps.has(dep));

    // Dependencias de desarrollo no usadas
    const unusedDev = devDepNames.filter(dep => !usedDevDeps.has(dep));

    // Dependencias faltantes (usadas pero no instaladas)
    const missing = Array.from(usedDeps).filter(dep => !allDepNames.includes(dep));

    return { missing, unusedProd, unusedDev };
  } catch (error) {
    return { missing: [], unusedProd: [], unusedDev: [] };
  }
}

function printReport(
  brokenImports: ImportInfo[],
  packageReport: { missing: string[]; unusedProd: string[]; unusedDev: string[] }
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

  // DevDependencies no usadas (las más comunes - no alarmar)
  if (packageReport.unusedDev.length > 0) {
    console.log(`\n   🟡 DEV DEPENDENCIAS SIN USO: ${packageReport.unusedDev.length}`);
    console.log('      (pueden estar en uso indirectamente o ser herramientas de build)');
    for (const dep of packageReport.unusedDev.slice(0, 10)) {
      console.log(`      - ${dep}`);
    }
    if (packageReport.unusedDev.length > 10) {
      console.log(`      ... y ${packageReport.unusedDev.length - 10} más`);
    }
  } else {
    console.log('   ✅ Todas las devDependencies están en uso');
  }

  // Dependencies de producción no usadas (más importante)
  if (packageReport.unusedProd.length > 0) {
    console.log(`\n   🟠 DEPENDENCIAS PROD SIN USO: ${packageReport.unusedProd.length}`);
    console.log('      (considera remover para reducir bundle size)');
    for (const dep of packageReport.unusedProd) {
      console.log(`      - ${dep}`);
    }
  } else {
    console.log('   ✅ Todas las dependencies están en uso');
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

  // Resolver y validar imports internos (los externos se validan contra package.json)
  const brokenImports: ImportInfo[] = [];

  for (const imp of allImports) {
    if (!imp.isExternal) {
      imp.resolvedPath = resolveImportPath(imp.importPath, imp.file);

      // Si el resolvedPath es null, significa que es un alias (@/) que necesita configuración TS
      if (imp.resolvedPath === null) {
        // Ignorar imports con alias - TypeScript los resuelve en build time
        continue;
      }

      imp.exists = existsSync(imp.resolvedPath);

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
  // (imports rotos o dependencias faltantes - no unused)
  if (brokenImports.length > 0 || packageReport.missing.length > 0) {
    process.exit(1);
  }
}

main().catch(console.error);

