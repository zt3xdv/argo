import { Client, Events, GatewayIntentBits } from "discord.js";
import { importFiles } from "./utils/file.ts";
import { makeRequest } from "./utils/request.ts";
import { join } from "node:path";
import createServer from "./server.ts";

process.loadEnvFile();

process.on('uncaughtException', console.error);
process.on('unhandledRejection', console.error);

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildPresences,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.MessageContent
  ],
  allowedMentions: { parse: [] },
});
const server = createServer(client);

client.langs = await makeRequest("https://translate.google.com/translate_a/l", { method: "GET", response: "JSON", timeout: 10000, params: { client: "webapp", hl: "en" } });
client.commands = await importFiles(join(import.meta.dirname, "commands"));
client.events = await importFiles(join(import.meta.dirname, "events"));

client.events.forEach((event: any) => {
  if (event.once) {
    client.once(event.eventName, event.execute);
  } else {
    client.on(event.eventName, event.execute);
  }
});

client.login(process.env.DISCORD_TOKEN).then(() => server.listen(process.env.SERVER_PORT, () => console.log(`Server running on ${process.env.SERVER_PORT}`)));
