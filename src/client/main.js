import path from 'node:path';
import { readFile } from "node:fs/promises";
import { Client, GatewayIntentBits, Routes } from '@discordjs/core';
import { REST } from '@discordjs/rest';
import { WebSocketManager } from '@discordjs/ws';
import { load } from '../utils/loaders.js';
import { getAsset } from "../utils/utils.js";
import { transformCommand } from '../builders/command.js';
import { initWasm } from "@resvg/resvg-wasm";
import { create as createApiServer } from "../builders/api.js";
import config from '../../config.json' with { type: 'json' };

// init resvg wasm
await initWasm((
  await readFile(
    path.join(import.meta.dirname, "..", "..", "node_modules", "@resvg", "resvg-wasm", "index_bg.wasm")
  )
));

const rest = new REST({ version: '10' }).setToken(config.token);

const gateway = new WebSocketManager({
  token: config.token,
  rest,
  intents: GatewayIntentBits.Guilds | GatewayIntentBits.GuildMembers
});
gateway.shards = new Map();

const client = new Client({ rest, gateway });
client.commands = await load(path.join(import.meta.dirname, "commands"), "command");
client.events = await load(path.join(import.meta.dirname, "events"), "event");
client.emojis = await rest.get(Routes.applicationEmojis(config.clientId));
client.fontBuffers = [
  new Uint8Array(await getAsset(path.join("fonts", "geist.ttf")))
];
client.api = createApiServer(client);

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
  body: [...client.commands.values()].flatMap((command) => {
    const originalCommand = transformCommand(command);

    const typesCommands = Object.entries(command.types ?? {}).map(
      ([type, types]) => {
        const transformedCommand = transformCommand({
          ...command,
          ...types,
          type: Number(type),
        });

        const {
          description,
          options,
          types: _types,
          defer,
          ...contextMenuCommand
        } = transformedCommand;

        return contextMenuCommand;
      },
    );

    return [
      originalCommand,
      ...typesCommands,
    ];
  }),
});

await gateway.connect();
client.api.listen({ port: config.port, host: "0.0.0.0" });
