import { readdir } from "node:fs/promises";
import { join } from "node:path";

export async function getFiles(dirPath: string): Promise<string[]> {
  const entries = await readdir(dirPath, { withFileTypes: true });

  const files = await Promise.all(
    entries.map(async (entry) => {
      const resPath = join(dirPath, entry.name);
      
      if (entry.isDirectory()) {
        return getFiles(resPath);
      }
      
      if (entry.isFile() && (entry.name.endsWith(".ts") || entry.name.endsWith(".js"))) {
        return resPath;
      }
      
      return [];
    })
  );

  return files.flat();
}

export async function importFiles(absolutePath: string) {
  const allFiles = await getFiles(absolutePath);
  let imports:any[] = [];

  for (const filePath of allFiles) {
    // Needed in new node versions ig
    const moduleUrl = `file://${filePath}`;
    
    try {
      const imported = await import(moduleUrl);
      imports = [...imports, imported.default];
      
    } catch (error) {
      console.error(`Error importing ${filePath}:`, error);
    }
  }
  
  return imports;
}

