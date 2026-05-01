---
name: constitution-hygiene
description: "Procedimientos de higiene, seguridad del oráculo y limpieza de memoria NotebookLM."
---

# 🧹 PROCEDIMIENTOS DE HIGIENE Y SEGURIDAD DEL ORÁCULO

## 1. HIGIENE DE CONTEXTO ESTRICTA (PURGA SSOT)
**Queda estrictamente PROHIBIDO conservar reportes de fallos temporales** en NotebookLM. El Agente DEBE purgar de inmediato estos documentos del contexto para evitar "Semantic Matching Bias" (RAG Hallucination).

## 2. BLOQUEO DE SEGURIDAD DEL ORÁCULO
Si el Agente detecta que la conexión está caída con NotebookLM, DEBE DETENERSE INMEDIATAMENTE para evitar inyectar información corrupta.

## 📜 PROCEDIMIENTO INFALIBLE (Ejecución de Tareas)
Toda interacción debe completar obligatoriamente este ciclo:
* **Paso 0**: Validación de Realidad.
* **Paso 1**: Resonancia con el Núcleo Supremo.
* **Paso 2**: Entrega de Diff Atómico.
* **Paso 3**: Certificación Estética de la fracción alterada.
* **Paso 4**: Higiene de Contexto y Purga de reportes temporales.
