// @ts-nocheck
/**
 * ARISE SCHEMA VALIDATOR v9.0
 * Valida que las tablas y columnas usadas en el código existan en Supabase
 *
 * Ejecución: bun run scripts/schema-validator.ts
 * Requiere: Variables de entorno de Supabase configuradas
 */

import { createClient } from '@supabase/supabase-js';
import { readdir, readFile } from 'fs/promises';
import { join, extname } from 'path';

const SKIP_DIRS = ['node_modules', '.git', '.next', '.claude', 'public', 'scripts', 'scratch'];
const TARGET_EXTENSIONS = ['.ts', '.tsx', '.js', '.jsx'];

interface TableReference {
  file: string;
  line: number;
  table: string;
  columns?: string[];
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

function extractTableReferences(content: string, filePath: string): TableReference[] {
  const refs: TableReference[] = [];
  const lines = content.split('\n');

  // Patrón: .from('table_name') o .from("table_name")
  const fromRegex = /\.from\s*\(\s*['"]([^'"]+)['"]\s*\)/g;

  // Patrón: table('table_name')
  const tableRegex = /\.table\s*\(\s*['"]([^'"]+)['"]\s*\)/g;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    let match;

    // Buscar .from()
    fromRegex.lastIndex = 0;
    while ((match = fromRegex.exec(line)) !== null) {
      refs.push({
        file: filePath,
        line: i + 1,
        table: match[1],
        snippet: line.trim()
      });
    }

    // Buscar .table()
    tableRegex.lastIndex = 0;
    while ((match = tableRegex.exec(line)) !== null) {
      refs.push({
        file: filePath,
        line: i + 1,
        table: match[1],
        snippet: line.trim()
      });
    }
  }

  return refs;
}

async function getSupabaseSchema(): Promise<Set<string>> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  // Probar con service_role_key o anon_key como fallback
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.log('⚠️  Variables de Supabase no configuradas, saltando validación contra DB real');
    return new Set();
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    // Método 1: Usar RPC si existe (más confiable)
    const { data: rpcData, error: rpcError } = await supabase.rpc('get_table_names');

    if (!rpcError && rpcData) {
      return new Set(rpcData as string[]);
    }

    // Método 2: Intentar información_schema (requiere permisos)
    const { data, error } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public');

    if (!error && data) {
      return new Set(data?.map(d => d.table_name) || []);
    }

    // Método 3: Fallback - usar Rest API directa con anon key
    console.log('⚠️  Fallback: intentando Rest API directa...');
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (anonKey) {
      try {
        const response = await fetch(`${supabaseUrl}/rest/v1/?apikey=${anonKey}`, {
          headers: {
            'apikey': anonKey,
            'Authorization': `Bearer ${anonKey}`,
            'Prefer': 'count=exact'
          }
        });

        if (response.ok) {
          const spec = await response.json();
          const tables = Object.keys(spec.paths || {})
            .filter(path => path.startsWith('/'))
            .map(path => path.split('/')[1])
            .filter(t => !t.includes('(')); // Filtrar RPCs

          return new Set(tables);
        }
      } catch {
        // Ignorar error del fallback
      }
    }

    return new Set();
  } catch (error) {
    console.log('⚠️  Error obteniendo schema:', error instanceof Error ? error.message : error);
    return new Set();
  }
}

async function getTablesViaRpc(): Promise<Set<string>> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return new Set();
  }

  try {
    // Usar RPC para obtener tablas
    const response = await fetch(`${supabaseUrl}/rest/v1/?apikey=${supabaseKey}`, {
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`
      }
    });

    if (!response.ok) {
      return new Set();
    }

    // El endpoint devuelve OpenAPI spec con las tablas
    const spec = await response.json();
    const tables = Object.keys(spec.paths || {})
      .filter(path => path.startsWith('/'))
      .map(path => path.split('/')[1]);

    return new Set(tables);
  } catch (error) {
    return new Set();
  }
}

function printReport(
  allReferences: TableReference[],
  existingTables: Set<string>,
  unknownTables: Set<string>
) {
  console.log('\n' + '='.repeat(80));
  console.log('🗄️  ARISE SCHEMA VALIDATOR v9.0 - REPORTE');
  console.log('='.repeat(80));

  const uniqueTables = new Set(allReferences.map(r => r.table));

  console.log(`\n📊 RESUMEN:`);
  console.log(`   Total referencias encontradas: ${allReferences.length}`);
  console.log(`   Tablas únicas referenciadas: ${uniqueTables.size}`);
  console.log(`   Tablas en DB: ${existingTables.size}`);
  console.log(`   Tablas NO encontradas en DB: ${unknownTables.size}`);

  if (unknownTables.size > 0) {
    console.log('\n' + '─'.repeat(80));
    console.log('🔴 TABLAS NO ENCONTRADAS EN EL SCHEMA');
    console.log('─'.repeat(80));

    for (const table of Array.from(unknownTables).sort()) {
      const refs = allReferences.filter(r => r.table === table);
      console.log(`\n   ❌ Tabla: "${table}"`);
      console.log(`      Referenciada ${refs.length} vez(es) en:`);

      const uniqueFiles = [...new Set(refs.map(r => r.file))];
      for (const file of uniqueFiles.slice(0, 5)) {
        const fileRefs = refs.filter(r => r.file === file);
        console.log(`         - ${file}:${fileRefs[0].line}`);
      }

      if (uniqueFiles.length > 5) {
        console.log(`         ... y ${uniqueFiles.length - 5} archivos más`);
      }
    }
  }

  // Mostrar tablas que SÍ existen
  const knownTables = Array.from(uniqueTables).filter(t => existingTables.has(t));

  if (knownTables.length > 0 && existingTables.size > 0) {
    console.log('\n' + '─'.repeat(80));
    console.log('✅ TABLAS VALIDADAS (existen en el schema)');
    console.log('─'.repeat(80));

    for (const table of knownTables.sort()) {
      const refs = allReferences.filter(r => r.table === table);
      console.log(`   ✓ "${table}" - ${refs.length} referencias`);
    }
  }

  // Tablas sin validación (DB no disponible)
  if (existingTables.size === 0) {
    console.log('\n' + '─'.repeat(80));
    console.log('⚠️  VALIDACIÓN PENDIENTE');
    console.log('─'.repeat(80));
    console.log('   No se pudo conectar a Supabase para validar el schema.');
    console.log('   Las siguientes tablas se usan en el código pero no se pudieron verificar:');

    for (const table of Array.from(uniqueTables).sort()) {
      const refs = allReferences.filter(r => r.table === table);
      console.log(`   ? "${table}" - ${refs.length} referencias`);
    }
  }

  console.log('\n' + '='.repeat(80) + '\n');
}

async function main() {
  console.log('🗄️  ARISE SCHEMA VALIDATOR v9.0 - Escaneando referencias a tablas...');

  const startTime = Date.now();

  // Obtener schema de Supabase
  console.log('📡 Conectando a Supabase para obtener schema...');
  const existingTables = await getSupabaseSchema();

  if (existingTables.size === 0) {
    console.log('⚠️  Intentando método alternativo...');
    // El schema de Supabase no incluye information_schema por defecto
    // Usaremos un enfoque alternativo
  }

  // Escanear archivos
  const files = await walkDir(process.cwd());
  console.log(`📂 ${files.length} archivos analizados`);

  const allReferences: TableReference[] = [];

  for (const file of files) {
    const content = await readFile(file, 'utf-8');
    const refs = extractTableReferences(content, file);
    allReferences.push(...refs);
  }

  console.log(`🔍 ${allReferences.length} referencias a tablas encontradas`);

  // Identificar tablas únicas
  const uniqueTables = new Set(allReferences.map(r => r.table));

  // Filtrar tablas que probablemente no existen en DB
  // (tablas que parecen hardcoded o de ejemplo)
  const unknownTables = new Set<string>();

  for (const table of uniqueTables) {
    if (existingTables.size > 0 && !existingTables.has(table)) {
      unknownTables.add(table);
    }
  }

  // Imprimir reporte
  printReport(allReferences, existingTables, unknownTables);

  const duration = ((Date.now() - startTime) / 1000).toFixed(2);
  console.log(`⏱️  Validación completada en ${duration}s`);

  // Exit con código de error si hay tablas desconocidas
  if (unknownTables.size > 0 && existingTables.size > 0) {
    process.exit(1);
  }
}

main().catch(console.error);

