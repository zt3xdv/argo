import { writeFileSync, readFileSync, existsSync, renameSync, rmSync } from "node:fs";

class DatabaseEngine {
  private readonly filePath: string;
  private readonly tempFilePath: string;
  private memoryStorage: Record<string, any>;

  constructor(filePath: string) {
    this.filePath = filePath;
    this.tempFilePath = `${filePath}.tmp`;
    this.memoryStorage = {};
    this.initialize();
  }

  private initialize(): void {
    if (existsSync(this.filePath)) {
      try {
        const rawContent = readFileSync(this.filePath, "utf-8");
        const decoded = Buffer.from(rawContent, "base64").toString("utf-8");
        this.memoryStorage = JSON.parse(decoded || "{}");
      } catch {
        this.memoryStorage = {};
      }
    } else {
      this.persist();
    }
  }

  private persist(): void {
    try {
      const serialized = JSON.stringify(this.memoryStorage);
      const encoded = Buffer.from(serialized, "utf-8").toString("base64");
      
      writeFileSync(this.tempFilePath, encoded, "utf-8");
      renameSync(this.tempFilePath, this.filePath);
    } catch (error) {
      if (existsSync(this.tempFilePath)) {
        try { rmSync(this.tempFilePath); } catch {}
      }
      throw new Error(`Database persistence failure: ${(error as Error).message}`);
    }
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
        if (targetPath.length === 0) {
          return false;
        }
        this.updatePath(targetPath, value);
        this.persist();
        return true;
      }
    });
  }

  private resolvePath(path: string[]): any {
    let current = this.memoryStorage;
    for (const key of path) {
      if (current === null || typeof current !== "object" || !(key in current)) {
        return undefined;
      }
      current = current[key];
    }
    return current;
  }

  private updatePath(path: string[], value: any): void {
    let current = this.memoryStorage;
    for (let i = 0; i < path.length - 1; i++) {
      const key = path[i];
      if (typeof current[key] !== "object" || current[key] === null) {
        current[key] = {};
      }
      current = current[key];
    }
    current[path[path.length - 1]] = value;
  }
}

export class Database {
  constructor(filePath: string) {
    const engine = new DatabaseEngine(filePath);
    return engine.createProxy();
  }
}
