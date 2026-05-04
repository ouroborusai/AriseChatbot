/**
 * ARISE WHATSAPP MESSAGE PARSER Diamond v12.0 (Diamond Resilience)
 * Parser inteligente para respuestas de IA con formato interactivo
 *
 * Formato soportado:
 * - "Texto de respuesta --- Opción 1 | Opción 2 | Opción 3"
 * - "Texto --- [[action:inventory_add]] Opción 1 | Opción 2"
 */

import {
  WHATSAPP_LIMITS,
  buildTextMessage,
  buildButtonMessage,
  buildListMessage,
  buildCatalogMessage,
  buildProductMessage,
  type WhatsAppMessage,
  type InteractiveMessagePayload,
  type AIInteractiveParseResult,
  type ParsedInteractiveOption,
} from './whatsapp';
import { logger } from './logger';

export type { WhatsAppMessage, InteractiveMessagePayload, AIInteractiveParseResult, ParsedInteractiveOption };

/**
 * Parsea el contenido de una respuesta de IA y detecta elementos interactivos
 */
export function parseInteractiveContent(content: string): AIInteractiveParseResult {
  const separator = '---';
  
  // --- CODE BODYGUARD: Cleanup Markdown Artifacts ---
  // Eliminar bloques de código ```json ... ``` que la IA a veces incluye por error
  let cleanContent = content.replace(/```json[\s\S]*?```/g, '').trim();
  // Eliminar bloques de código genéricos ``` ... ```
  cleanContent = cleanContent.replace(/```[\s\S]*?```/g, '').trim();

  // Si no hay separador, es texto plano
  if (!cleanContent.includes(separator)) {
    return {
      hasInteractive: false,
      bodyText: cleanContent,
      options: [],
    };
  }

  const parts = cleanContent.split(separator).map(s => s.trim());
  
  // El texto del cuerpo es todo excepto la última parte (botones)
  // Re-unimos las partes previas por si la IA usó --- dentro del mensaje
  const bodyText = parts.slice(0, -1).join(' --- ').trim() || 'Seleccione una opción:';

  // La última parte después del --- contiene las opciones
  const optionsPart = parts[parts.length - 1];

  // Parsear opciones separadas por |
  const rawOptions = optionsPart.split('|').map(o => o.trim()).filter(o => o.length > 0);

  // Extraer opciones limpias (sin tags de acción [[...]])
  const options = rawOptions.map((opt, index) => {
    // Extraer tags de acción si existen (Regex seguro para evitar backtracking)
    const actionMatch = opt.match(/\[\[([^\[\]]+)\]\]/);
    const actionPayload = actionMatch ? actionMatch[1] : null;

    // Limpiar el texto de la opción omitiendo los bloques de acción
    let cleanTitle = opt.replace(/\[\[[^\[\]]+\]\]/g, '').trim();

    // --- CODE BODYGUARD: WhatsApp Button Limit (24 chars) ---
    if (cleanTitle.length > 24) {
      logger.warn(`Truncating option title from ${cleanTitle.length} to 24 chars: ${cleanTitle}`, 'WHATSAPP_PARSER');
      cleanTitle = cleanTitle.substring(0, 21) + '...';
    }

    return {
      id: `opt_${index}_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      title: cleanTitle || `Opción ${index + 1}`,
      actionPayload: actionPayload || undefined,
      _uiMetadata: {
        borderRadius: 40,
        color: '#22c55e'
      } as const
    };
  });

  return {
    hasInteractive: options.length > 0,
    bodyText,
    options,
    footer: extractFooter(bodyText),
    uiMetadata: {
      borderRadius: 40,
      brandColor: '#22c55e'
    } as const
  };
}

/**
 * Extrae un footer opcional del texto (última línea si empieza con > o ---)
 */
function extractFooter(text: string): string | undefined {
  const lines = text.split('\n');
  const lastLine = lines[lines.length - 1]?.trim();

  if (lastLine?.startsWith('>')) {
    return lastLine.substring(1).trim();
  }

  return undefined;
}

/**
 * Construye el mensaje de WhatsApp apropiado según la cantidad de opciones
 *
 * Reglas Diamond v12.0:
 * - Detección de [[CATALOG]] -> Catalog Message
 * - Detección de [[PRODUCT:ID]] -> Product Message
 * - 1-3 opciones: Botones interactivos (mejor UX)
 * - 4+ opciones: Lista interactiva (más capacidad)
 */
export function buildWhatsAppMessage(
  phone: string,
  content: string,
  catalogId?: string
): WhatsAppMessage {
  // 1. Detectar comandos de catálogo/producto globales en el texto
  if (content.includes('[[CATALOG]]')) {
    const cleanBody = content.replace(/\[\[CATALOG\]\]/g, '').trim();
    return buildCatalogMessage(phone, cleanBody || 'Explora nuestro catálogo oficial:');
  }

  const productMatch = content.match(/\[\[PRODUCT:([^\[\]]+)\]\]/);
  if (productMatch && catalogId) {
    const productId = productMatch[1];
    const cleanBody = content.replace(/\[\[PRODUCT:[^\[\]]+\]\]/g, '').trim();
    return buildProductMessage(phone, catalogId, productId, cleanBody);
  }

  const parsed = parseInteractiveContent(content);

  // Si no hay opciones interactivas, enviar texto plano
  if (!parsed.hasInteractive || parsed.options.length === 0) {
    return buildTextMessage(phone, content);
  }

  // 2. Detectar comandos en las opciones
  const catalogOption = parsed.options.find(opt => opt.actionPayload === 'CATALOG');
  if (catalogOption) {
    return buildCatalogMessage(phone, parsed.bodyText, parsed.footer);
  }

  const productOption = parsed.options.find(opt => opt.actionPayload?.startsWith('PRODUCT:'));
  if (productOption && catalogId) {
    const productId = productOption.actionPayload!.split(':')[1];
    return buildProductMessage(phone, catalogId, productId, parsed.bodyText, parsed.footer);
  }

  // 1-3 opciones: Botones
  if (parsed.options.length <= WHATSAPP_LIMITS.MAX_BUTTONS) {
    return buildButtonMessage(
      phone,
      parsed.bodyText,
      parsed.options.map(opt => ({
        id: opt.id,
        title: opt.title,
      })),
      parsed.footer
    );
  }

  // 4+ opciones: Lista interactiva
  return buildListMessage(
    phone,
    parsed.bodyText,
    [
      {
        title: 'Opciones',
        rows: parsed.options.map(opt => ({
          id: opt.id,
          title: opt.title,
          description: opt.actionPayload ? `Acción: ${opt.actionPayload}` : undefined,
        })),
      },
    ],
    'Ver Opciones',
    undefined,
    parsed.footer || 'Diamond v12.0 Resilience'
  );
}

/**
 * Valida que un mensaje cumpla con los límites de WhatsApp
 */
export function validateMessage(content: string): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (content.length > WHATSAPP_LIMITS.MAX_TEXT_LENGTH) {
    errors.push(`El texto excede ${WHATSAPP_LIMITS.MAX_TEXT_LENGTH} caracteres`);
  }

  const parsed = parseInteractiveContent(content);

  if (parsed.options.length > WHATSAPP_LIMITS.MAX_LIST_SECTIONS * WHATSAPP_LIMITS.MAX_ROWS_PER_SECTION) {
    errors.push(`Demasiadas opciones (máx ${WHATSAPP_LIMITS.MAX_LIST_SECTIONS * WHATSAPP_LIMITS.MAX_ROWS_PER_SECTION})`);
  }

  // Validar longitud de cada opción
  parsed.options.forEach((opt, i) => {
    if (opt.title.length > WHATSAPP_LIMITS.MAX_ROW_TITLE_LENGTH) {
      errors.push(`Opción ${i + 1} excede ${WHATSAPP_LIMITS.MAX_ROW_TITLE_LENGTH} caracteres`);
    }
  });

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Formatea una respuesta de IA para WhatsApp
 *
 * Ejemplo de uso:
 * const formatted = formatAIResponse(
 *   "Hola! ¿Qué deseas hacer?",
 *   ["Ver Contactos", "Agregar Cliente", "Buscar"]
 * );
 * // Resultado: "Hola! ¿Qué deseas hacer? --- Ver Contactos | Agregar Cliente | Buscar"
 */
export interface ParsedMessageContent {
  textParts: string[];
  buttonParts: string[][];
}

export function formatAIResponse(
  bodyText: string,
  options: string[]
): string {
  if (options.length === 0) {
    return bodyText;
  }

  return `${bodyText.trim()} --- ${options.join(' | ')}`;
}

/**
 * Extrae las opciones de un mensaje ya formateado
 * Útil para debugging o logging
 */
export function extractOptionsFromMessage(content: string): string[] {
  const parsed = parseInteractiveContent(content);
  return parsed.options.map(opt => opt.title);
}

/**
 * Logger de depuración para desarrollo
 */
export function debugParse(content: string): void {
  const parsed = parseInteractiveContent(content);

  logger.debug('═══════════════════════════════════════════════════════════', 'WHATSAPP_PARSER');
  logger.debug('🔍 DEBUG PARSE - ARISE Diamond v12.0', 'WHATSAPP_PARSER');
  logger.debug('═══════════════════════════════════════════════════════════', 'WHATSAPP_PARSER');
  logger.debug(`📝 Body Text: ${parsed.bodyText.substring(0, 50)}...`, 'WHATSAPP_PARSER');
  logger.debug(`🔢 Opciones: ${parsed.options.length}`, 'WHATSAPP_PARSER');
  logger.debug(`🎯 Interactivo: ${parsed.hasInteractive ? 'SÍ' : 'NO'}`, 'WHATSAPP_PARSER');

  if (parsed.options.length > 0) {
    logger.debug('\n📋 OPCIONES:', 'WHATSAPP_PARSER');
    parsed.options.forEach((opt, i) => {
      logger.debug(`   ${i + 1}. ${opt.title}${opt.actionPayload ? ` [[${opt.actionPayload}]]` : ''}`, 'WHATSAPP_PARSER');
    });
  }

  const validation = validateMessage(content);
  if (!validation.valid) {
    logger.debug('\n⚠️ ERRORES DE VALIDACIÓN:', 'WHATSAPP_PARSER');
    validation.errors.forEach(err => logger.debug(`   - ${err}`, 'WHATSAPP_PARSER'));
  } else {
    logger.debug('\n✅ Mensaje válido', 'WHATSAPP_PARSER');
  }

  logger.debug('═══════════════════════════════════════════════════════════\n', 'WHATSAPP_PARSER');
}

/**
 * PARSER PARA UI (ARISE Diamond v12.0 resilient)
 * Divide el mensaje en partes de texto y bloques de botones, manejando múltiples separadores ---
 *
 * Estrategia: El último --- separa el cuerpo del bloque de botones
 * Esto permite que el texto de la IA contenga --- sin romper el parseo
 */
export function parseUIMessageContent(content: string): ParsedMessageContent {
  const textParts: string[] = [];
  const buttonParts: string[][] = [];

  // Encontrar el último --- que marca el inicio de los botones
  const lastSeparatorIndex = content.lastIndexOf('---');

  if (lastSeparatorIndex === -1) {
    // Sin separadores, todo es texto
    return { textParts: [content.trim()], buttonParts: [] };
  }

  // Todo antes del último --- es texto (puede contener --- internos)
  const bodyContent = content.substring(0, lastSeparatorIndex).trim();
  textParts.push(bodyContent);

  // Todo después del último --- son potenciales botones
  const buttonsContent = content.substring(lastSeparatorIndex + 3).trim();

  if (buttonsContent.includes('|')) {
    // Múltiples botones separados por |
    const buttons = buttonsContent
      .split('|')
      .map(b => b.replace(/\[\[[^\[\]]+\]\]/g, '').trim())
      .filter(b => b.length > 0);

    if (buttons.length > 0) {
      buttonParts.push(buttons);
    } else {
      // Si no hay botones válidos, el segmento se trata como texto
      textParts.push(buttonsContent);
    }
  } else if (buttonsContent.length > 0) {
    // Un solo botón sin separador |
    const cleanButton = buttonsContent.replace(/\[\[[^\[\]]+\]\]/g, '').trim();
    if (cleanButton.length > 0) {
      buttonParts.push([cleanButton]);
    }
  }

  return { textParts, buttonParts };
}
