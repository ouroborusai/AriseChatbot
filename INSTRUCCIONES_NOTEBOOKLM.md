# 📘 Guía de Uso: NotebookLM MCP Server (Arise v9.0)

Este repositorio utiliza un servidor MCP para sincronizar la inteligencia del proyecto con **NotebookLM**. Sigue estas instrucciones para mantener el SSOT (Single Source of Truth) actualizado en tu nueva PC.

## 1. Instalación y Requisitos
Asegúrate de tener instalado el MCP de NotebookLM en tu configuración de Claude Desktop o la herramienta que utilices.

## 2. Autenticación (Paso Crítico)
Las sesiones de NotebookLM expiran frecuentemente. Si ves errores de "Authentication expired", haz lo siguiente:

1.  **Ejecuta el comando en tu terminal:**
    ```bash
    notebooklm-mcp-auth --file
    ```
2.  **Extracción de Cookies:**
    *   Abre Chrome e ingresa a [notebooklm.google.com](https://notebooklm.google.com).
    *   Presiona `F12` (DevTools) -> Pestaña **Network**.
    *   Filtra por `batchexecute`.
    *   Haz clic en cualquier acción (abrir un cuaderno) para disparar la petición.
    *   Busca el encabezado `cookie:` de la petición `batchexecute`.
    *   Copia el **valor completo** del cookie.
3.  **Guardar Tokens:**
    *   El comando terminal te pedirá la ruta. Crea un archivo `cookies.txt`, pega el contenido y guarda.
    *   Ingresa el nombre del archivo en la terminal.

## 3. Comandos de Sincronización
Una vez autenticado, puedes pedirle a la IA:
*   *"Lista mis cuadernos"*
*   *"Actualiza el SSOT de v9.0"*
*   *"Limpia los cuadernos antiguos y deja solo el principal"*

## 4. Cuaderno Principal
El SSOT reside en el cuaderno:
**ID:** `b5cc3496-eb3d-4d12-9d77-b2ab9eccd79a`
**Nombre:** `ARISE: CEREBRO NEURAL (Códigos y Estructura)`

---
**Nota:** Mantener este cuaderno limpio es vital para la estabilidad de la IA. No permitas que se acumulen versiones obsoletas (v7/v8).
