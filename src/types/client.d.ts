import type { Client } from 'discord.js';

declare module 'discord.js' {
  interface Client {
    commands: any;
    events: any;
    langs: any;
  }
}
