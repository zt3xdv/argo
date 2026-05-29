import { Client, Events, GatewayIntentBits } from "discord.js";
import { importFiles } from "./utils/file.ts";
import { join } from "node:path";
import createServer from "./server.ts";

process.loadEnvFile();

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

client.commands = await importFiles(join(import.meta.dirname, "commands"));
client.events = await importFiles(join(import.meta.dirname, "events"));

client.events.forEach((event: any) => {
  if (event.once) {
    client.once(event.eventName, (e) => event.execute(client, e));
  } else {
    client.on(event.eventName, (e) => event.execute(client, e));
  }
});

client.login(process.env.DISCORD_TOKEN).then(() => server.listen(process.env.SERVER_PORT, () => console.log(`Server running on ${process.env.SERVER_PORT}`)));
