import { SnowflakeUtil, type Message, type Client } from 'discord.js';
import { importFiles } from "./file.ts";
import { join } from "path";

export const ReadableFileSizeUnits = ['kB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];

export function ReadableFileSize(bytes: number, micro = false, precision = 1): string {
  const thresh = micro ? 1000 : 1024;

  if (Math.abs(bytes) < thresh) {
    return `${bytes} B`;
  }

  let unit = -1;
  const round = 10 ** precision;

  do {
    bytes /= thresh;
    ++unit;
  } while (Math.round(Math.abs(bytes) * round) / round >= thresh && unit < ReadableFileSizeUnits.length - 1);

  return `${bytes.toFixed(precision)} ${ReadableFileSizeUnits[unit]}`;
}

export function FormatTime(duration: number | string) {
  const total = Math.floor(Number(duration) / 1000);
  const days = Math.floor(total / (24 * 60 * 60));
  const hours = Math.floor((total % (24 * 60 * 60)) / (60 * 60));
  const minutes = Math.floor((total % (60 * 60)) / 60);
  const seconds = total % 60;
  const milliseconds = Math.floor((Number(duration) % 1000) / 100);

  const parts = [];

  if (days > 0) parts.push(`${days}d`);
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  if (seconds > 0) parts.push(`${seconds}s`);
  if (milliseconds > 0) parts.push(`${milliseconds}ms`);

  return parts.join(' ');
}

export function FormatCurrency(amount: number, currency: string) {
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

export async function Reference(message: Message) {
  let last = message;
  let after = SnowflakeUtil.generate({
    timestamp: message.createdTimestamp - 1,
  }).toString();

  return (await message.channel.messages.fetch({ after })).reduce((list, current) => {
    if (current.reference && current.reference.messageId === last.id && current.author.id === message.client.user.id) {
      last = current;
      list.push(current);
    }

    return list;
  }, [] as Message[]);
}

export function Commas(num: number | string) {
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
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
