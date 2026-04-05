const { generateAssistantReply } = require('./lib/ai-service');

async function testAI() {
  try {
    const systemPrompt = 'Eres un asistente útil.';
    const history = [];
    const message = 'Hola, ¿cómo estás?';

    console.log('🤖 Probando IA con Gemini...');
    const response = await generateAssistantReply(systemPrompt, history, message);
    console.log('✅ Respuesta:', response);
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testAI();