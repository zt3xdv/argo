import { openSync, readSync, statSync, existsSync, appendFileSync, readFileSync } from "node:fs";

class DatabaseEngine {
  private readonly filePath: string;
  private index: Record<string, { pos: number; len: number }> = {};
  private fileDescriptor!: number;

  constructor(filePath: string) {
    this.filePath = filePath;
    this.buildIndex();
    this.fileDescriptor = openSync(this.filePath, "r+");
  }

  private buildIndex(): void {
    if (!existsSync(this.filePath)) {
      appendFileSync(this.filePath, "", "utf-8");
    }

    const content = readFileSync(this.filePath, "utf-8");
    const lines = content.split("\n");
    let currentByteOffset = 0;

    for (const line of lines) {
      if (!line.trim()) continue;
      try {
        const colonIndex = line.indexOf(":");
        if (colonIndex !== -1) {
          const key = line.substring(0, colonIndex);
          this.index[key] = {
            pos: currentByteOffset + colonIndex + 1,
            len: line.length - colonIndex - 1
          };
        }
      } catch {}
      currentByteOffset += Buffer.byteLength(line, "utf-8") + 1;
    }
  }

  private readValueFromDisk(key: string): any {
    const pointer = this.index[key];
    if (!pointer) return undefined;

    const buffer = Buffer.alloc(pointer.len);
    readSync(this.fileDescriptor, buffer, 0, pointer.len, pointer.pos);
    
    const decoded = buffer.toString("utf-8");
    return JSON.parse(Buffer.from(decoded, "base64").toString("utf-8"));
  }

  private writeValueToDisk(key: string, value: any): void {
    const serialized = JSON.stringify(value);
    const encoded = Buffer.from(serialized, "utf-8").toString("base64");
    const lineToAppend = `${key}:${encoded}\n`;

    const stats = statSync(this.filePath);
    const startByte = stats.size;

    appendFileSync(this.filePath, lineToAppend, "utf-8");

    this.index[key] = {
      pos: startByte + Buffer.byteLength(key, "utf-8") + 1,
      len: Buffer.byteLength(encoded, "utf-8")
    };
  }

  public createProxy(path: string[] = []): any {
    return new Proxy(Object.create(null), {
      get: (_, property: string): any => {
        if (property === "data") {
          return this.resolvePath(path);
        }
        return this.createProxy([...path, property]);
      },
      set: (_, property: string, value: any): boolean => {
        const targetPath = property === "data" ? path : [...path, property];
        if (targetPath.length === 0) return false;

        this.updatePath(targetPath, value);
        return true;
      }
    });
  }

  private resolvePath(path: string[]): any {
    if (path.length === 0) return undefined;
    const rootKey = path[0];
    let current = this.readValueFromDisk(rootKey);

    for (let i = 1; i < path.length; i++) {
      if (current === null || typeof current !== "object") return undefined;
      current = current[path[i]];
    }
    return current;
  }

  private updatePath(path: string[], value: any): void {
    const rootKey = path[0];
    
    if (path.length === 1) {
      this.writeValueToDisk(rootKey, value);
      return;
    }

    let rootObject = this.readValueFromDisk(rootKey) || {};
    let temp = rootObject;

    for (let i = 1; i < path.length - 1; i++) {
      const key = path[i];
      if (typeof temp[key] !== "object" || temp[key] === null) {
        temp[key] = {};
      }
      temp = temp[key];
    }
    
    temp[path[path.length - 1]] = value;
    this.writeValueToDisk(rootKey, rootObject);
  }
}

export class Database {
  constructor(filePath: string) {
    const engine = new DatabaseEngine(filePath);
    return engine.createProxy();
  }
}
