# 📘 Guía de Uso: NotebookLM MCP Server (Arise v10.2)

Este repositorio utiliza un servidor MCP para sincronizar la inteligencia del proyecto con **NotebookLM**. 

## 1. Fuentes de Verdad (SSOT)
Para que la IA entienda el estado actual del proyecto, **DEBE** leer los siguientes archivos en orden:

1.  `docs/ARISE_CORE_MANIFEST_v10.2.md`: Estructura general y Pipeline de PDF.
2.  `docs/TRIGGERS_AND_AUTOMATION_v10.2.md`: Lógica de automatización y pre-generación.
3.  `src/lib/pdf/pipeline.ts`: Implementación técnica real.

## 2. Autenticación (Paso Crítico)
Si ves errores de "Authentication expired":
1.  Obtén la cookie de `batchexecute` desde Chrome DevTools.
2.  Pégala en `cookies.txt`.
3.  Ejecuta `notebooklm-mcp-auth --file cookies.txt` en la terminal.

## 3. Cuaderno Principal
**ID:** `b5cc3496-eb3d-4d12-9d77-b2ab9eccd79a`
**Nombre:** `ARISE: CEREBRO NEURAL (Diamond v10.2)`

---
**Nota:** El proyecto ha sido limpiado de versiones obsoletas (v7/v8/v9). No utilices archivos en carpetas como `knowledge_base` o `raw_data` ya que han sido eliminados por redundancia.

