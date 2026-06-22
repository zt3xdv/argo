import type { Client } from "discord.js";
import type { QuickDB } from "quick.db";

declare module 'discord.js' {
  interface Client {
    commands: Array;
    events: Array;
    langs: { [key: string]: { [key: string]: string } };
    db: QuickDB;
    debug: any;
  }
}
