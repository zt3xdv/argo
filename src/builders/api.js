import Fastify from "fastify";
import fastifyRawBody from "fastify-raw-body";
import fastifyStatic from "@fastify/static";
import { verifyWebhook } from "../utils/utils.js";
import { handleVote } from "../client/handlers/vote.js";
import config from '../../config.json' with { type: 'json' };

export async function create(client) {
  const app = Fastify({
    // logger: true,
  });

  await app.register(fastifyRawBody, {
    field: "rawBody",
    global: false,
    encoding: "utf8",
    runFirst: true,
  });
  
  await app.register(fastifyStatic, {
    root: path.join(import.meta.dirname, "..", "assets"),
    prefix: "/assets/",
    decorateReply: true
  });
  
  await app.register(fastifyStatic, {
    root: path.join(import.meta.dirname, "..", "..", "dist"),
    prefix: "/",
    decorateReply: true
  });

  app.post("/webhooks/topgg", { config: { rawBody: true } }, async (request, reply) => {
    const signatureHeader = request.headers["x-topgg-signature"];
    const signature = Array.isArray(signatureHeader) ? signatureHeader[0] : signatureHeader;

    const valid = verifyWebhook(request.rawBody, signature, config.topggWebhookKey);

    if (!valid) {
      return reply.code(401).send({ success: false, error: "Invalid webhook signature" });
    }

    await handleVote(request.body, client);
    return reply.send({ success: true });
  });
  
  app.get("/", async (request, reply) => {
    return reply.send("perhaps there isnt nothing yet, but yeah ig");
  });
  
  return app;
}
