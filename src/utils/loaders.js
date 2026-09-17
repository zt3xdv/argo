import { readdir } from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

async function getFiles(directory) {
  const entries = await readdir(directory, {
    withFileTypes: true
  });

  const files = [];

  for (const entry of entries) {
    const fullPath = path.join(directory, entry.name);

    if (entry.isDirectory()) {
      files.push(...(await getFiles(fullPath)));
      continue;
    }

    if (entry.isFile() && entry.name.endsWith('.js')) {
      files.push(fullPath);
    }
  }

  return files;
}

async function importModules(directory) {
  const files = await getFiles(directory);
  const modules = [];

  for (const file of files) {
    const importedModule = await import(pathToFileURL(file).href);

    modules.push({
      file,
      module: importedModule.default ?? importedModule
    });
  }

  return modules;
}

export async function loadCommands(directory) {
  const modules = await importModules(directory);
  const commands = new Map();

  for (const { file, module: command } of modules) {
    commands.set(command.name, command);
  }

  return commands;
}

export async function loadEvents(directory) {
  const modules = await importModules(directory);
  const events = [];

  for (const { file, module: event } of modules) {
    events.push(event);
  }

  return events;
}

export function registerEvents(client, events) {
  for (const event of events) {
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
}
