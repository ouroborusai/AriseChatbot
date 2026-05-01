---
name: constitution-webhooks
description: "Leyes de arquitectura backend, webhooks, aislamiento tenant y telemetría."
---

# 🏗️ LEYES DE ARQUITECTURA, BACKEND Y WEBHOOKS

## 1. AISLAMIENTO TENANT INQUEBRANTABLE (RLS)
Toda query del lado del servidor debe incluir `.eq('company_id', companyId)` obligatoriamente, sin delegar ciegamente en el Row Level Security (RLS) de la base de datos.

## 2. REGLA "CERO ANY" EN WEBHOOKS
Los Webhooks y manejadores de órdenes operan bajo "Cero 'any'". Todas las interfaces deben ser estrictas (SSOT Compliance) para garantizar la resiliencia en la recepción de Meta Graph API Webhooks.

## 3. TELEMETRÍA PLATINUM OBLIGATORIA
Cualquier interacción o acción crítica en el backend (ej. recepción de pedidos, ruteo de acciones, generación de documentos) debe registrarse utilizando la función `logEvent` en la tabla `audit_logs` para asegurar la auditoría centralizada y la trazabilidad de la conversación.

## 4. ESTÁNDARES DE CATÁLOGO Y RUTEO
- **Inventario Data-First**: La fuente única de verdad para el manejo de inventario es la tabla `inventory_items` en Supabase. 
- **Ley del Guión Bajo**: Los identificadores técnicos (categorías, SKUs) deben usar obligatoriamente guiones bajos (`_`).
- **Límites de Meta UI**: Se debe respetar los límites de la API de WhatsApp, estructurando las respuestas en botones (1-3 opciones) o listas (4+ opciones) sin superar los umbrales de caracteres establecidos.
