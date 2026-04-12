import { handleInboundUserMessage } from '../lib/webhook-handler';

async function testProspect() {
  console.log("INICIANDO PRUEBA...");
  await handleInboundUserMessage({
    from: "56991535230",
    profileName: "om",
    text: { body: "hola" }
  });
  console.log("PRUEBA FINALIZADA");
}

testProspect().catch(console.error);
