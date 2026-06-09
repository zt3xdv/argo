import { REST, Routes } from "discord.js";
import { importFiles } from "./utils/file.ts";
import { join } from "node:path";

process.loadEnvFile();

const rest = new REST({ version: 10 });
rest.setToken(process.env.DISCORD_TOKEN);

const commands = await importFiles(join(import.meta.dirname, "commands"));
const commandsData = commands.flatMap(c => {
  c.data.integration_types = [0, 1];
  c.data.contexts = [0, 1, 2];
      
  if (c.data && c.data.messageContext) {
    const duplicate = { ...c.data, description: undefined, options: undefined, type: 3, ...c.data.messageContext };
    
    return [duplicate, c.data];
  }
  
  return [c.data];
});

try {
  const res = await rest.put(Routes.applicationCommands(process.env.CLIENT_ID), { body: commandsData });
  if (res) {
    console.log(`Deployed commands: ${res.map(c => c.name).join(" ")}`);
  }
} catch (e) {
  console.log("Failed to deploy commands: ", e);
}
