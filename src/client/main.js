import path from 'node:path';
import config from '../../config.json' with { type: 'json' };
import { Client, GatewayIntentBits, Routes } from '@discordjs/core';
import { REST } from '@discordjs/rest';
import { WebSocketManager, WebSocketShardEvents } from '@discordjs/ws';
import { load } from '../utils/loaders.js';
import { transformCommand } from '../builders/command.js';

const rest = new REST({ version: '10' }).setToken(config.token);

const gateway = new WebSocketManager({
  token: config.token,
  rest,
  intents: GatewayIntentBits.Guilds
});
gateway.shards = new Map();

const client = new Client({ rest, gateway });
client.commands = await load(path.join(import.meta.dirname, "..", "interactions", "commands"), "command");
client.events = await load(path.join(import.meta.dirname, "..", "interactions", "events"), "event");
client.emojis = await rest.get(Routes.applicationEmojis(config.clientId));

for (const event of client.events) {
  const target = event.type === "gateway" ? client.gateway : client;

  const listener = async (...args) => {
    try {
      await event.execute(...args, client);
    } catch (error) {
      console.error(`Error executing event "${event.name}":`, error);
    }
  };

  if (event.once) {
    target.once(event.name, listener);
  } else {
    target.on(event.name, listener);
  }
}
  
await rest.put(Routes.applicationCommands(config.clientId), {
  body: [...client.commands.values()].map((command) => transformCommand(command))
});
await gateway.connect();
