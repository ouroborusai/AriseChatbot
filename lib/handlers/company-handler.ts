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
    const query = text.trim().toLowerCase();
    
    // 1. Validar si los datos ingresados parecen un RUT
    const looksLikeRut = /^[0-9.-]+[kK]?$/.test(query.replace(/\s/g, ''));
    
    if (looksLikeRut) {
      const cleanRut = query.replace(/[^0-9kK]/g, '').toUpperCase();
      // Formatear RUT para búsqueda (ej: 12345678-9)
      const formattedRut = cleanRut.length > 1 
        ? `${cleanRut.slice(0, -1)}-${cleanRut.slice(-1)}`
        : cleanRut;

      console.log(`[CompanyHandler] 🔍 Buscando empresa global por RUT: ${formattedRut}`);
      
      const { data: globalMatch } = await getSupabaseAdmin()
        .from('companies')
        .select('*')
        .or(`rut.eq.${formattedRut},rut.eq.${cleanRut}`)
        .maybeSingle();

      if (globalMatch) {
        console.log(`[CompanyHandler] ✅ Empresa encontrada: ${globalMatch.legal_name}. Vinculando...`);
        
        // Vincular contacto con esta empresa
        await getSupabaseAdmin().from('contact_companies').upsert({
          contact_id: this.context.contact.id,
          company_id: globalMatch.id,
          is_primary: true
        });

        // Ascender a cliente
        await getSupabaseAdmin().from('contacts').update({ segment: 'cliente' }).eq('id', this.context.contact.id);

        await this.activateCompany(globalMatch.id, conversationId);
        
        await sendWhatsAppMessage(
          phoneNumber, 
          `¡Identificación exitosa! ✅ He vinculado tu número a *${globalMatch.legal_name}*.\n\nYa puedes acceder a toda la información de tu empresa.`
        );
        
        // Retornamos handled: true. El webhook-handler se encargará de mostrar el menú actualizado.
        return { handled: true };
      } else {
        // Si parecía un RUT pero no se encontró, informamos al usuario
        await sendWhatsAppMessage(
          phoneNumber,
          "No encontré ninguna empresa vinculada a ese RUT en nuestros registros. 🧐 Por favor, asegúrate de escribirlo correctamente o contacta a tu asesor."
        );
        return { handled: true };
      }
    }

    // 2. Si no es RUT y el usuario tiene múltiples empresas, buscar en las ya vinculadas (por nombre)
    if (companies.length > 1) {
      const localMatch = companies.find(c => c.legal_name.toLowerCase().includes(query));

      if (localMatch) {
        await this.activateCompany(localMatch.id, conversationId);
        await sendWhatsAppMessage(phoneNumber, `Perfecto. Empresa seleccionada: ${localMatch.legal_name}`);
        return { handled: true };
      }
      
      await sendWhatsAppMessage(phoneNumber, 'No encontré esa empresa en tu lista. ¿Podrías escribir el nombre más exacto?');
      return { handled: true };
    }

    return { handled: false };
  }


  /**
   * Helper para activar una empresa
   */
  private async activateCompany(companyId: string, conversationId: string) {
    await getSupabaseAdmin()
      .from('conversations')
      .update({ active_company_id: companyId })
      .eq('id', conversationId);
    this.updateContext({ activeCompanyId: companyId });
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
    serviceRequests: [],
    lastAction: null,
    conversationHistory: [],
    redirectCount: 0,
  };

  const handler = new CompanyHandler(context);
  return handler.autoSelectCompany(conversationId, companies);
}
