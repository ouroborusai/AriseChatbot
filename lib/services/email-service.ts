import nodemailer from 'nodemailer';

export interface EmailOptions {
  to: string;
  subject: string;
  text?: string;
  html?: string;
  attachments?: Array<{
    filename: string;
    path: string;
    contentType?: string;
  }>;
}

export class EmailService {
  private static transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_PASS,
    },
  });

  /**
   * Envía un correo electrónico usando Gmail
   */
  static async sendEmail(options: EmailOptions): Promise<{ success: boolean; messageId?: string; error?: any }> {
    console.log(`[EmailService] Intentando enviar mail a: ${options.to}`);
    
    if (!process.env.GMAIL_USER || !process.env.GMAIL_PASS) {
      console.error('[EmailService] ERROR: GMAIL_USER o GMAIL_PASS no configurados en .env');
      return { success: false, error: 'Credenciales de Gmail no configuradas' };
    }

    try {
      const info = await this.transporter.sendMail({
        from: `"Arise Chatbot" <${process.env.GMAIL_USER}>`,
        ...options,
      });

      console.log('[EmailService] ✅ Email enviado:', info.messageId);
      return { success: true, messageId: info.messageId };
    } catch (error) {
      console.error('[EmailService] ❌ Error enviando email:', error);
      return { success: false, error };
    }
  }

  /**
   * Envía un documento PDF a un cliente por correo
   */
  static async sendDocumentToClient(email: string, clientName: string, docTitle: string, docUrl: string) {
    const subject = `📄 Tu documento: ${docTitle} - Arise Chatbot`;
    const html = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; rounded-lg">
        <h2 style="color: #059669;">Hola ${clientName}!</h2>
        <p>Adjunto a este correo (o vía el enlace de abajo) encontrarás el documento que solicitaste desde nuestro asistente de WhatsApp.</p>
        
        <div style="background-color: #f8fafc; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <p><strong>Documento:</strong> ${docTitle}</p>
        </div>

        <p>Puedes descargarlo directamente aquí:</p>
        <a href="${docUrl}" style="display: inline-block; background-color: #059669; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-weight: bold;">Descargar Documento</a>
        
        <p style="margin-top: 30px; font-size: 12px; color: #64748b;">
          Este es un correo automático enviado por Arise Chatbot para MTZ Consultores. 
          Si tienes dudas, por favor contacta a tu asesor directamente.
        </p>
      </div>
    `;

    return this.sendEmail({
      to: email,
      subject,
      html,
      attachments: [
        {
          filename: `${docTitle}.pdf`,
          path: docUrl,
          contentType: 'application/pdf'
        }
      ]
    });
  }
}
