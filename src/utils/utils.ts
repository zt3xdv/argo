import { type Client } from 'discord.js';
import { importFiles } from "./file.ts";
import { join } from "path";

export const statusEmoji = (status: string) =>
  ({ away: 'idle', dnd: 'busy' } as Record<string, string>)[status] ?? status;

export function formatTime(duration: number | string) {
  let s = Math.floor(Number(duration) / 1000);
  const units: Array<[n: number, suf: string]> = [
    [86400, 'd'], [3600, 'h'], [60, 'm'], [1, 's'],
  ];
  return units.reduce<string[]>((acc, [u, suf]) => {
    const v = Math.floor(s / u);
    if (v) acc.push(`${v}${suf}`);
    s %= u;
    return acc;
  }, []).join(' ');
}

export function formatCurrency(amount: number, currency: string) {
  const formatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency
  });

  return formatter
    .formatToParts(amount)
    .filter(part => part.type !== 'currency')
    .map(part => part.value)
    .join('')
    .trim();
}

export function formatTimestamp(time: number, flag: string = 't') {
  return `<t:${Math.floor(time / 1000)}:${flag}>`;
}

export function capitalizeString(text: string) {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

export function isDeveloper(id: string) {
  return process.env.DEVELOPERS_IDS.split(",").includes(id);
}

export async function reload(client: Client) {
  client.events.forEach((event: any) => {
    client.debug("unloading event", event.name);
    client.off(event.eventName, event.execute);
  });
  
  client.commands = await importFiles(join(import.meta.dirname, "..", "commands"));
  client.events = await importFiles(join(import.meta.dirname, "..", "events"));
  
  client.events.forEach((event: any) => {
    client.debug("loading event", event.name);
    if (event.once) {
      client.once(event.eventName, event.execute);
    } else {
      client.on(event.eventName, event.execute);
    }
  });
}

export function makeEphemeral(interaction) {
  if (!interaction.isRepliable || !interaction.isRepliable()) return interaction;

  const originalReply = interaction.reply;
  interaction.reply = function (options) {
    if (typeof options === 'string') options = { content: options };
    return originalReply.call(this, { ...options, ephemeral: true });
  };

  const originalDeferReply = interaction.deferReply;
  interaction.deferReply = function (options) {
    return originalDeferReply.call(this, { ...options, ephemeral: true });
  };
    
  const originalFollowUp = interaction.followUp;
  interaction.followUp = function (options) {
    if (typeof options === 'string') options = { content: options };
    return originalFollowUp.call(this, { ...options, ephemeral: true });
  };

  return interaction;
}

export function getCDN(route: string, size: number = 4096, format: string = 'webp', animated: boolean = false): string {
  return `https://cdn.discordapp.com/${route}.${format}?size=${size}&animated=${animated}`;
}
