import { generateAndSendAIResponse } from './src/lib/neural-engine/whatsapp';

async function runTest() {
    console.log("🧪 INICIANDO PRUEBA DEL SIMULADOR NEURAL v10.3...");
    console.log("----------------------------------------------");
    console.log("MENSAJE: 'Agrega 20 martillos pro al inventario'");
    
    const result = await generateAndSendAIResponse({
        content: "Agrega 20 martillos pro al inventario",
        companyId: "77777777-7777-7777-7777-777777777777",
        contactId: null,
        conversationId: "test_sim_123",
        sender: "SIMULATOR",
        phoneNumberId: "SIM_PHONE",
        whatsappToken: "SIM_TOKEN",
        simulationMode: true
    });

    console.log("\n🤖 RESPUESTA DE ARISE:");
    console.log(result.ai_response || result.text);
    
    if (result.options || result.interactive_buttons) {
        console.log("\n🔘 BOTONES SUGERIDOS:");
        const opts = result.options || result.interactive_buttons;
        opts.forEach((opt: any) => console.log(`- [${opt.title}] (ID: ${opt.id})`));
    }
    
    console.log("\n✅ PRUEBA FINALIZADA CON ÉXITO.");
}

runTest().catch(console.error);
