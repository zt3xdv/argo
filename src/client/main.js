import path from 'node:path';
import config from '../../config.json' with { type: 'json' };
import { Client, GatewayIntentBits, Routes } from '@discordjs/core';
import { REST } from '@discordjs/rest';
import { WebSocketManager, WebSocketShardEvents } from '@discordjs/ws';
import { loadCommands, loadEvents, registerEvents } from '../utils/loaders.js';
import { transformCommand } from '../builders/command.js';

const rest = new REST({ version: '10' }).setToken(config.token);

const gateway = new WebSocketManager({
  token: config.token,
  rest,
  intents: GatewayIntentBits.Guilds
});
gateway.shards = new Map();

const client = new Client({ rest, gateway });
client.commands = await loadCommands(path.join(import.meta.dirname, "..", "interactions", "commands"));
client.rest = rest;
client.token = config.token;
client.clientId = config.clientId;

registerEvents(client, (await loadEvents(path.join(import.meta.dirname, "..", "interactions", "events"))));

const res = await rest.put(Routes.applicationCommands(config.clientId), {
  body: [...client.commands.values()].map((command) => transformCommand(command))
});
console.log(`${res.length} command(s) registered`);

await gateway.connect();
