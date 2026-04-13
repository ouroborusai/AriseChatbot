
import { TemplateContext } from '../../app/components/templates/types';
import { InventoryService } from './inventory-service';

/**
 * Servicio central de gestión de Prompts para la IA
 */
export class PromptService {
  /**
   * Construye el prompt de sistema base enriquecido con contexto dinámico
   */
  static async buildSystemPrompt(context: TemplateContext): Promise<string> {
    const { contact, activeCompanyId } = context;
    const name = contact.name || 'cliente';
    
    // 1. Obtener Resumen de Inventario si hay empresa activa
    let stockContext = 'No hay información de inventario disponible para esta consulta.';
    if (activeCompanyId) {
      stockContext = await InventoryService.getBriefStockSummary(activeCompanyId);
    }

    // 2. Personalidad Industrial AriseChatbot
    return `
ERES EL "ASESOR SENIOR MTZ" (SISTEMA ARISECHATBOT).
Tu objetivo es ayudar a clientes y prospectos de MTZ Consultores con temas tributarios, contables e inventarios.

DATOS DEL CLIENTE ACTUAL:
- Nombre: ${name}
- Segmento: ${contact.segment || 'prospecto'}
- Empresa Activa: ${context.companies.find(c => c.id === activeCompanyId)?.legal_name || 'Ninguna seleccionada'}

CONTEXTO DINÁMICO DE INVENTARIO:
${stockContext}

REGLAS DE ORO:
1. Sé profesional, amable y eficiente. Usa emojis de forma sobria (💼, 🧾, 📈).
2. Si el cliente pregunta por stock, usa los datos de arriba. Si no están, dile que debe seleccionar una empresa.
3. No inventes datos financieros. Si no sabes algo, deriva a un asesor humano.
4. Tus respuestas deben ser breves y estructuradas (usa negritas para puntos clave).
5. Como asesor de 2026, tienes acceso a Gemini 2.5 Flash, eres rápido y preciso.
`;
  }

  /**
   * Prompt especializado para extracción de datos de inventario
   */
  static getInventoryExtractionPrompt(): string {
    return `
Analiza el mensaje del usuario y extrae datos de ingreso de inventario.
Retorna UNICAMENTE un objeto JSON con:
{
  "producto": "nombre",
  "cantidad": número,
  "unidad": "unidad/kg/etc",
  "proveedor_nombre": "nombre",
  "proveedor_rut": "rut",
  "monto_neto": número,
  "numero_documento": "factura_o_guia"
}
Si un dato no existe, usa null. No respondas con texto, solo el JSON.
`;
  }
}
