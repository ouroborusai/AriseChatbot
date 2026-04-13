
import { getOrCreateContact, getOrCreateConversation, saveMessage } from '../database-service';
import { sendWhatsAppMessage } from '../whatsapp-service';
import { ContextService } from '../services/context-service';
import { listCompaniesForContact } from '../database-service';

/**
 * Handler especializado para archivos multimedia (Documentos, Imágenes, Audios)
 */
export class MediaHandler {
  /**
   * Procesa documentos e imágenes recibidas (Buzón de Recepción)
   */
  static async handleMediaUpload(phoneNumber: string, profileName: string | undefined, mediaData: { id: string, type: 'document' | 'image' }): Promise<boolean> {
    console.log(`[MediaHandler] 📁 Procesando ${mediaData.type} ID: ${mediaData.id}`);
    try {
      const contact = await getOrCreateContact(phoneNumber, profileName);
      const conversationId = await getOrCreateConversation(phoneNumber, contact.id);
      const companies = await listCompaniesForContact(contact.id);
      const context = await ContextService.buildContext(contact, companies, null, conversationId);

      // Solo procesamos si el usuario está en el contexto de "buzón de recepción"
      if (context.lastAction === 'buzon_recepcion') {
        const typeLabel = mediaData.type === 'document' ? 'documento' : 'foto';
        await saveMessage(conversationId, 'user', `[Archivo recibido: ${typeLabel} ID ${mediaData.id}]`);

        await sendWhatsAppMessage(phoneNumber, `✅ He recibido tu ${typeLabel} correctamente. Lo guardaré en tu expediente para que el contador lo revise. ¿Necesitas enviar algo más?`);
        return true;
      }
      return false;
    } catch (err) {
      console.error('[MediaHandler] ❌ Error en handleMediaUpload:', err);
      return false;
    }
  }

  /**
   * Transcribe y procesa mensajes de voz
   */
  static async handleAudio(audioData: { id: string }): Promise<string> {
    try {
      console.log(`[MediaHandler] 🎙️ Transcribiendo audio ID: ${audioData.id}`);
      const { getWhatsAppMediaUrl, downloadWhatsAppMedia } = await import('../whatsapp-service');
      const { transcribeAudio } = await import('../ai-service');
      
      const audioUrl = await getWhatsAppMediaUrl(audioData.id);
      const audioBuffer = await downloadWhatsAppMedia(audioUrl);
      const transcription = await transcribeAudio(audioBuffer, `voice_${audioData.id}.ogg`);
      
      return transcription;
    } catch (err) {
      console.error('[MediaHandler] ❌ Error transcribiendo audio:', err);
      return 'Mensaje de voz (error de procesamiento)';
    }
  }
}
