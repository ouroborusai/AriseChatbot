# 🗺️ Mapa de Flujos de Plantillas WhatsApp

**MTZ Consultores Tributarios** - Última actualización: 2026-04-11

---

## 📊 Resumen

| Métrica | Valor |
|---------|-------|
| Total de plantillas | **33** |
| Flujos principales | **8** |
| Segmentos | `cliente`, `prospecto`, `todos` |

---

## 🟢 1. FLUJO PRINCIPAL CLIENTE

```
┌─────────────────────────────────────────────────────────────────┐
│                    MENÚ PRINCIPAL CLIENTE                        │
│                    id: menu_principal_cliente                    │
│                                                                  │
│  "¡Hola, {{nombre}}! 👋 Soy el asistente virtual de MTZ..."     │
│                                                                  │
│  LISTA: [Mis Documentos, Mis Datos, Trámites, Hablar con asesor]│
└─────────────────────────────────────────────────────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        ▼                     ▼                     ▼
┌───────────────┐     ┌───────────────┐     ┌──────────────┐
│ MIS DATOS     │     │ TRÁMITES      │     │ DOCUMENTOS   │
│ menu_mis_datos│     │menu_tramites  │     │menu_documentos
│               │     │               │     │              │
│ • Email       │     │ • IVA         │     │ • Ver docs   │
│ • Teléfono    │     │ • Renta       │     │ • Solicitar  │
│ • Empresas    │     │ • Nómina      │     │              │
└───────────────┘     └───────────────┘     └──────────────┘
```

---

## 🟡 2. FLUJO IVA

```
┌─────────────────────────────────────────────────────────────────┐
│                         MENÚ IVA                                 │
│                         id: menu_iva                             │
│                                                                  │
│  "🧾 Aquí están tus declaraciones de IVA. ¿Cuál necesitas?"     │
│                                                                  │
│  LISTA: [{{iva_list}}]                                          │
│  BOTONES: [Solicitar IVA, Ver otro IVA, ← Volver]               │
└─────────────────────────────────────────────────────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        ▼                     ▼                     ▼
┌───────────────┐     ┌───────────────┐     ┌──────────────┐
│ IVA NO DISP.  │     │ SOLICITAR IVA │     │ VER IVA      │
│iva_no_dispon. │     │iva_solicitar  │     │iva_ver_doc   │
│               │     │               │     │              │
│ → Solicitar   │     │ → ¿Contactar? │     │ → Envía doc  │
│ → Asesor      │     │ → Sí: Derivar │     │ → Otro período
└───────────────┘     └───────────────┘     └──────────────┘
```

**Condiciones:**
- `menu_iva` requiere: `min_document_count: 1`, `required_document_type: 'iva'`
- Fallback: `iva_no_disponible`

---

## 🔵 3. FLUJO RENTA

```
┌─────────────────────────────────────────────────────────────────┐
│                        MENÚ RENTA                                │
│                        id: menu_renta                            │
│                                                                  │
│  "📊 ¿Qué necesitas de tu declaración de renta?"                 │
│                                                                  │
│  LISTA: [{{renta_list}}]                                        │
│  BOTONES: [Solicitar, Ver otra, ← Volver]                       │
└─────────────────────────────────────────────────────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        ▼                     ▼                     ▼
┌───────────────┐     ┌───────────────┐     ┌──────────────┐
│ SOLICITAR     │     │ VER RENTA     │     │ INFO RENTA   │
│renta_solicitar│     │renta_ver_doc  │     │tramite_renta │
│               │     │               │     │              │
│ → ¿Confirmas? │     │ → Envía doc   │     │ → Más info   │
│ → Derivar     │     │ → Otra decl.  │     │ → Cotizar    │
└───────────────┘     └───────────────┘     └──────────────┘
```

---

## 🟣 4. FLUJO NÓMINA

```
┌─────────────────────────────────────────────────────────────────┐
│                       MENÚ NÓMINA                                │
│                       id: menu_nomina                            │
│                                                                  │
│  "👥 ¿Qué necesitas de nóminas?"                                 │
│                                                                  │
│  LISTA: [Liquidaciones, Contratos, Solicitar]                   │
└─────────────────────────────────────────────────────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        ▼                     ▼                     ▼
┌───────────────┐     ┌───────────────┐     ┌──────────────┐
│ LIQUIDACIONES │     │ CONTRATOS     │     │ SOLICITAR    │
│nomina_liq.    │     │nomina_cont.   │     │nomina_sol.   │
│               │     │               │     │              │
│ • Última liq. │     │ • Ver contrato│     │ → Derivar    │
│ • Ver todas   │     │ → Volver      │     │              │
│ → Volver      │     │               │     │              │
└───────────────┘     └───────────────┘     └──────────────┘
        │                     │
        ▼                     ▼
┌───────────────┐     ┌───────────────┐
│ VER LIQ.      │     │ VER CONTRATO  │
│nomina_ver_liq │     │nomina_ver_cont│
│               │     │               │
│ → Envía doc   │     │ → Envía doc   │
│ → Otra liq.   │     │ → Volver      │
└───────────────┘     └───────────────┘
```

---

## 🟠 5. FLUJO BALANCES

```
┌─────────────────────────────────────────────────────────────────┐
│                      MENÚ BALANCES                               │
│                      id: menu_balance                            │
│                                                                  │
│  "📈 ¿Qué balances necesitas?"                                   │
│                                                                  │
│  LISTA: [Mensual, Anual, Solicitar]                             │
└─────────────────────────────────────────────────────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        ▼                     ▼                     ▼
┌───────────────┐     ┌───────────────┐     ┌──────────────┐
│ SOLICITAR     │     │ VER BALANCE   │     │              │
│balance_sol.   │     │balance_ver_doc│     │              │
│               │     │               │     │              │
│ → Derivar     │     │ → Envía doc   │     │              │
│ → Volver      │     │ → Otro balance│     │              │
└───────────────┘     └───────────────┘     └──────────────┘
```

---

## 🔴 6. FLUJO COBRANZA

```
┌─────────────────────────────────────────────────────────────────┐
│                   RECORDATORIO PAGO                              │
│                 id: cobranza_recordatorio                        │
│                                                                  │
│  "Estimado cliente, te recordamos que tu pago está pendiente..."│
│                                                                  │
│  BOTONES: [Ver detalles, 💳 Ya pagué]                           │
└─────────────────────────────────────────────────────────────────┘
                              │
        ┌─────────────────────┴─────────────────────┐
        ▼                                           ▼
┌───────────────┐                           ┌───────────────┐
│ DETALLES      │                           │ CONFIRMAR     │
│cobranza_det.  │                           │cobranza_conf. │
│               │                           │               │
│ → Asesor      │                           │ → Aceptar     │
│ → Volver      │                           │ → Gracias     │
└───────────────┘                           └───────────────┘
```

---

## 🟣 7. FLUJO PROSPECTO

```
┌─────────────────────────────────────────────────────────────────┐
│                   BIENVENIDA PROSPECTO                           │
│                 id: bienvenida_prospecto                         │
│                                                                  │
│  "¡Hola! 👋 Bienvenido a MTZ Consultores..."                    │
│                                                                  │
│  BOTONES: [Cotizar servicio, Ver servicios, Contactar asesor]   │
└─────────────────────────────────────────────────────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        ▼                     ▼                     ▼
┌───────────────┐     ┌───────────────┐     ┌──────────────┐
│ COTIZAR       │     │ SERVICIOS     │     │ ASESOR       │
│cotizacion_info│     │servicios_gen. │     │derivacion_as.│
│               │     │               │     │              │
│ → Tengo info  │     │ LISTA:        │     │ → ¿Llamar?   │
│ → Que llamen  │     │ • IVA, Renta  │     │ → Gracias    │
│               │     │ • Cotizar     │     │              │
└───────────────┘     └───────────────┘     └──────────────┘
        │
        ▼
┌───────────────┐
│ COTIZAR REC.  │
│cotiz_recoger  │
│               │
│ → Envía datos │
└───────────────┘
```

---

## ⚪ 8. FLUJOS TRANSVERSALES

### Derivación a Asesor
```
derivacion_asesor → derivacion_confirmar → gracias
```

### Cierre
```
gracias → [🔄 Nueva consulta → menu_principal_cliente]
```

### Actualización de Datos
```
actualizar_email → menu_mis_datos
actualizar_telefono → menu_mis_datos
vincular_empresa → derivacion_asesor / menu_empresas
```

---

## 📋 Tabla de Referencia Rápida

| ID Plantilla | Categoría | Segmento | Workflow | next_template_ids |
|--------------|-----------|----------|----------|-------------------|
| `menu_principal_cliente` | bienvenida | cliente | atencion | menu_documentos, menu_mis_datos, menu_tramites |
| `menu_mis_datos` | general | cliente | general | actualizar_email, actualizar_telefono, menu_empresas |
| `menu_empresas` | general | cliente | general | vincular_empresa, derivacion_asesor |
| `menu_tramites` | tramites | cliente | documentos | menu_iva, menu_renta, menu_nomina, menu_balance |
| `menu_iva` | tramites | cliente | iva | iva_solicitar, iva_ver_documento |
| `menu_renta` | tramites | cliente | renta | renta_solicitar, renta_ver_documento |
| `menu_nomina` | tramites | cliente | nomina | nomina_liquidaciones, nomina_contratos |
| `menu_balance` | tramites | cliente | documentos | balance_solicitar, balance_ver_documento |
| `bienvenida_prospecto` | bienvenida | prospecto | atencion | cotizacion_info, servicios_general, derivacion_asesor |
| `derivacion_asesor` | general | todos | asesor | derivacion_confirmar, gracias |
| `gracias` | general | todos | general | menu_principal_cliente |

---

## 🔧 Mantenimiento

### Agregar nueva plantilla
1. Crear archivo en `app/components/templates/data/` o agregar a existente
2. Exportar con `id` único
3. Agregar al `DEFAULT_TEMPLATES` en `index.ts`
4. Actualizar este documento

### Verificar referencias rotas
```sql
-- En Supabase, verificar que todos los next_template_id existan
SELECT DISTINCT action->>'next_template_id' as ref
FROM templates, jsonb_array_elements(actions) as action
WHERE action->>'next_template_id' IS NOT NULL
EXCEPT
SELECT id FROM templates;
```

---

**Generado automáticamente desde el análisis de código - 2026-04-11**
