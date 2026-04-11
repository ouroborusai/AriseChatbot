/**
 * Company Handler - Manejo de selección de empresas
 *
 * Maneja la selección y cambio de empresa activa en la conversación.
 * Extiende de BaseHandler para acceder a métodos comunes.
 */

import { getSupabaseAdmin } from '../supabase-admin';
import { sendWhatsAppMessage, sendWhatsAppInteractiveButtons, sendWhatsAppListMessage } from '../whatsapp-service';
import { BUTTON_IDS, Company, HandlerResponse } from '../types';
import { BaseHandler, buildContext } from './base-handler';
import { TemplateContext, Action } from '../../app/components/templates/types';
import { getFinalActions } from '@/lib/services/condition-engine';

const COMPANY_PREFIX = 'company_';

/**
 * Handler especializado para gestión de empresas
 */
export class CompanyHandler extends BaseHandler {
  constructor(context: TemplateContext) {
    super(context);
  }

  /**
   * Maneja selección de empresa por botón
   */
  async handleCompanyButton(
    interactive: string,
    phoneNumber: string,
    conversationId: string,
    companies: Company[]
  ): Promise<HandlerResponse> {
    // Botón de empresa específica (company_<id>)
    if (interactive.startsWith(COMPANY_PREFIX)) {
      const companyId = interactive.replace(COMPANY_PREFIX, '');

      await getSupabaseAdmin()
        .from('conversations')
        .update({ active_company_id: companyId })
        .eq('id', conversationId);

      // Actualizar contexto local
      this.updateContext({ activeCompanyId: companyId });

      const selectedCompany = companies.find(c => c.id === companyId);
      const msg = selectedCompany
        ? `Perfecto. Empresa seleccionada: ${selectedCompany.legal_name}`
        : 'Empresa seleccionada.';

      await sendWhatsAppMessage(phoneNumber, msg);
      return { handled: true };
    }

    // Botón para escribir empresa
    if (interactive === BUTTON_IDS.COMPANY_FREE_TEXT) {
      await sendWhatsAppMessage(
        phoneNumber,
        'Escribe el nombre (o parte) de la empresa tal como aparece en tu lista.'
      );
      return { handled: true };
    }

    // Botón de selección de empresa
    if (interactive === BUTTON_IDS.SELECT_COMPANY) {
      await this.sendCompanySelectionMenu(phoneNumber, companies);
      return { handled: true };
    }

    return { handled: false };
  }

  /**
   * Maneja texto libre para seleccionar empresa
   */
  async handleCompanyText(
    text: string,
    phoneNumber: string,
    conversationId: string,
    companies: Company[]
  ): Promise<HandlerResponse> {
    // Si tiene 0 o 1 empresa, no necesita selección manual
    if (companies.length <= 1) {
      return { handled: false };
    }

    const query = text.trim().toLowerCase();
    const match = companies.find(c => c.legal_name.toLowerCase().includes(query));

    if (match) {
      await getSupabaseAdmin()
        .from('conversations')
        .update({ active_company_id: match.id })
        .eq('id', conversationId);

      // Actualizar contexto local
      this.updateContext({ activeCompanyId: match.id });

      await sendWhatsAppMessage(
        phoneNumber,
        `Perfecto. Empresa seleccionada: ${match.legal_name}`
      );
      return { handled: true };
    }

    // No encontró coincidencia
    await sendWhatsAppMessage(
      phoneNumber,
      'No encontré esa empresa. ¿Podrías escribir el nombre más exacto?'
    );
    return { handled: true };
  }

  /**
   * Auto-seleccionar empresa si solo hay una
   * Retorna el ID de la empresa seleccionada o null
   */
  async autoSelectCompany(
    conversationId: string,
    companies: Company[]
  ): Promise<string | null> {
    if (companies.length === 1) {
      const companyId = companies[0].id;

      await getSupabaseAdmin()
        .from('conversations')
        .update({ active_company_id: companyId })
        .eq('id', conversationId);

      // Actualizar contexto local
      this.updateContext({ activeCompanyId: companyId });

      console.log('[CompanyHandler] Auto-seleccionada empresa:', companyId);
      return companyId;
    }

    return null;
  }

  /**
   * Muestra menú de selección de empresa con condiciones
   */
  async sendCompanySelectionMenu(
    phoneNumber: string,
    companies: Company[]
  ): Promise<void> {
    // Actualizar contexto con la lista de empresas
    this.updateContext({ companies: companies.map(c => ({
      id: c.id,
      legal_name: c.legal_name,
    })) });

    // Si hay más de 5 empresas, usar lista
    if (companies.length > 5) {
      const rows = companies.slice(0, 10).map(c => ({
        id: `${COMPANY_PREFIX}${c.id}`,
        title: c.legal_name.substring(0, 24),
        description: 'Seleccionar empresa'
      }));

      await sendWhatsAppListMessage(phoneNumber, {
        body: `Tienes ${companies.length} empresas vinculadas. ¿Para cuál necesitas la gestión?`,
        buttonText: 'Seleccionar',
        sections: [{
          title: 'Mis Empresas',
          rows
        }]
      });
      return;
    }

    // Usar botones interactivos (máximo 3)
    const firstTwo = companies.slice(0, 2);

    const buttons = [
      ...firstTwo.map(c => ({
        id: `${COMPANY_PREFIX}${c.id}`,
        title: c.legal_name.substring(0, 25)
      })),
      { id: BUTTON_IDS.COMPANY_FREE_TEXT, title: '📝 Escribir nombre' },
    ].slice(0, 3);

    await sendWhatsAppInteractiveButtons(
      phoneNumber,
      '¿Para qué empresa necesitas la gestión?',
      buttons
    );
  }

  /**
   * Verifica si hay múltiples empresas y requiere selección
   */
  requiresCompanySelection(): boolean {
    return this.getCompanyCount() > 1 && !this.hasActiveCompany();
  }

  /**
   * Obtiene el menú de selección de empresa con acciones condicionales
   */
  getCompanySelectionActions(companies: Company[]): Action[] {
    const actions: Action[] = [];

    // Agregar botones para las primeras 2 empresas
    companies.slice(0, 2).forEach(c => {
      actions.push({
        type: 'button',
        id: `${COMPANY_PREFIX}${c.id}`,
        title: c.legal_name.substring(0, 25),
      });
    });

    // Botón para escribir nombre
    actions.push({
      type: 'button',
      id: BUTTON_IDS.COMPANY_FREE_TEXT,
      title: '📝 Escribir nombre',
    });

    return actions;
  }
}

// Funciones exportadas para compatibilidad con código existente
export async function handleCompanyButton(
  interactive: string,
  phoneNumber: string,
  conversationId: string,
  companies: Company[]
): Promise<HandlerResponse> {
  const context = await buildContext(phoneNumber, '', conversationId);
  const handler = new CompanyHandler(context);
  return handler.handleCompanyButton(interactive, phoneNumber, conversationId, companies);
}

export async function handleCompanyText(
  text: string,
  phoneNumber: string,
  conversationId: string,
  companies: Company[]
): Promise<HandlerResponse> {
  const context = await buildContext(phoneNumber, '', conversationId);
  const handler = new CompanyHandler(context);
  return handler.handleCompanyText(text, phoneNumber, conversationId, companies);
}

export async function autoSelectCompany(
  conversationId: string,
  companies: Company[]
): Promise<string | null> {
  // Contexto básico para auto-selección
  const context: TemplateContext = {
    contact: { id: '', phone_number: '' },
    companies: companies.map(c => ({ id: c.id, legal_name: c.legal_name })),
    activeCompanyId: null,
    documents: [],
    lastAction: null,
    conversationHistory: [],
    redirectCount: 0,
  };

  const handler = new CompanyHandler(context);
  return handler.autoSelectCompany(conversationId, companies);
}
