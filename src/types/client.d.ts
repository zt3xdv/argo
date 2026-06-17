import type { Client } from "discord.js";
import type { Database } from "../utils/db.ts";

declare module 'discord.js' {
  interface Client {
    commands: Array;
    events: Array;
    langs: { [key: string]: { [key: string]: string } };
    database: Database;
    debug: any;
  }
}
