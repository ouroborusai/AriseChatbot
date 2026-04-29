import { NextResponse } from 'next/server';
import { generateAndSendAIResponse } from '@/lib/neural-engine/whatsapp';

/**
 * ARISE NEURAL SIMULATOR v10.3
 * POST /api/simulate
 * 
 * Payload: {
 *   content: "Quiero agregar 5 martillos al stock",
 *   companyId: "77777777-7777-7777-7777-777777777777"
 * }
 */
export async function POST(req: Request) {
  try {
    const { content, companyId, sender = 'SIMULATOR_USER' } = await req.json();

    if (!content || !companyId) {
      return NextResponse.json({ error: 'Missing content or companyId' }, { status: 400 });
    }

    // Ejecutar motor neural en modo simulación
    const result = await generateAndSendAIResponse({
      content,
      companyId,
      contactId: null,
      conversationId: 'simulated_conv',
      sender,
      phoneNumberId: 'SIM_PHONE',
      whatsappToken: 'SIM_TOKEN',
      simulationMode: true
    });

    return NextResponse.json({
      status: 'success',
      simulation: true,
      ai_response: result.text,
      interactive_buttons: result.options,
      raw: result
    });

  } catch (error: any) {
    return NextResponse.json({ 
      status: 'error', 
      message: error.message 
    }, { status: 500 });
  }
}
