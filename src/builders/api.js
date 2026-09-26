import Fastify from "fastify";

export function create(client) {
  const app = Fastify({
   // logger: true
  });
    
  app.post("/webhooks/topgg", async (request, reply) => {
    console.log(request.body);
    
    return reply.send({ success: true });
  });
    
  return app;
}
