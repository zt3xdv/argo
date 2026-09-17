import { readdir } from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

async function getFiles(directory) {
  const entries = await readdir(directory, {
    withFileTypes: true
  });

  const files = await Promise.all(
    entries.map(async (entry) => {
      const fullPath = path.join(directory, entry.name);

      if (entry.isDirectory()) {
        return getFiles(fullPath);
      }

      if (entry.isFile() && entry.name.endsWith('.js')) {
        return [fullPath];
      }

      return [];
    })
  );

  return files.flat();
}

async function importModules(directory) {
  const files = await getFiles(directory);

  return Promise.all(
    files.map(async (file) => {
      const importedModule = await import(pathToFileURL(file).href);

      return importedModule.default ?? importedModule;
    })
  );
}

export async function load(directory, type) {
  const modules = await importModules(directory);

  if (type === 'command') {
    return new Map(
      modules.map((command) => [command.name, command])
    );
  }

  if (type === 'event') {
    return modules;
  }

  throw new TypeError(`Invalid type: "${type}".`);
}
