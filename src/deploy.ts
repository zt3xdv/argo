import { REST, Routes } from "discord.js";
import { importFiles } from "./utils/file.ts";
import { join } from "node:path";
import { ApplicationCommandType } from "discord.js";

process.loadEnvFile();

const rest = new REST({ version: 10 });
rest.setToken(process.env.DISCORD_TOKEN);

const commands = await importFiles(join(import.meta.dirname, "commands"));
const commandsData = commands.flatMap(c => {
  const types = Array.isArray(c.data.type) ? c.data.type : [c.data.type || ApplicationCommandType.ChatInput];

  return types.map(type => {
    const baseCommand = {
      integration_types: [0, 1],
      contexts: [0, 1, 2],
      ...c.data,
      type
    };

    if (type === ApplicationCommandType.ChatInput) {
      return baseCommand;
    } else {
      delete baseCommand.description;
      delete baseCommand.options;

      return {
        ...baseCommand,
        ...(c.data.context || {})
      };
    }
  });
});

try {
  const res = await rest.put(Routes.applicationCommands(process.env.CLIENT_ID), { body: commandsData });
  if (res) {
    console.log(`Deployed commands: ${res.map(c => c.name).join(" ")}`);
    console.log(`Total: ${res.length}`);
  }
} catch (e) {
  console.log("Failed to deploy commands: ", e);
}
