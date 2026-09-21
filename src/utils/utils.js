import fs from "fs/promises";
import path from "path";
import { UserFlags, UserPremiumType } from "discord-api-types/v10";

export const assetsDir = path.resolve(import.meta.dirname, "../assets");

export const mimeTypes = {
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".ttf": "font/ttf",
};

const badgePaths = {
  [UserFlags.Staff]: "discord-staff.svg",
  [UserFlags.Partner]: "discord-partner.svg",
  [UserFlags.BugHunterLevel1]: "discord-bug-hunter-green.svg",
  [UserFlags.BugHunterLevel2]: "discord-bug-hunter-gold.svg",
  [UserFlags.HypeSquadOnlineHouse1]: "hype-squad-bravery.svg",
  [UserFlags.HypeSquadOnlineHouse2]: "hype-squad-brilliance.svg",
  [UserFlags.HypeSquadOnlineHouse3]: "hype-squad-balance.svg",
  [UserFlags.PremiumEarlySupporter]: "discord-early-supporter.svg",
  [UserFlags.BotHTTPInteractions]: "supports-commands.svg",
  [UserFlags.CertifiedModerator]: "discord-mod.svg",
};

export function getEmoji(name, client) {
  const emoji = client.emojis.items.find(e => e.name == name);
  return emoji ? `<${emoji.animated ? "a" : ""}:${emoji.name}:${emoji.id}>` : ":e:";
}

export function formatDiscordDate(date) {
  if (!date) return null;
  const timestamp = Math.floor(Date.parse(date) / 1000);
  if (Number.isNaN(timestamp)) return null;
  return `<t:${timestamp}:F> (<t:${timestamp}:R>)`;
}

export function escapeXml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

export function getGuildAssetUrl(type, guildId, hash, size = 1024) {
  if (!hash) return null;

  const extension = hash.startsWith("a_") ? "gif" : "png";

  return `https://cdn.discordapp.com/${type}/${guildId}/${hash}.${extension}?size=${size}`;
}

export async function fetchImage(url) {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Failed to fetch image: ${response.status}`);
  }

  return {
    mimeType: response.headers.get("content-type") ?? "image/png",
    base64: Buffer.from(await response.arrayBuffer()).toString("base64"),
  };
}

export function getSnowflakeDate(id) {
  const timestamp = Number(BigInt(id) >> 22n) + 1420070400000;

  return new Date(timestamp).toISOString();
}

export function formatBoolean(bool) {
  return bool ? "yes" : "no";
}

export function escapeMarkdown(text) {
  return text.replace(/[\\`*_{}\[\]()#+\-.!|>~=]/g, "\\$&");
}

export async function getAsset(relativePath, asBase64 = false) {
  const assetPath = path.resolve(assetsDir, relativePath);

  if (!assetPath.startsWith(`${assetsDir}${path.sep}`)) {
    throw new Error("Invalid asset path");
  }

  const file = await fs.readFile(assetPath);

  if (!asBase64) {
    return file;
  }

  const extension = path.extname(assetPath).toLowerCase();
  const mimeType = mimeTypes[extension];

  if (!mimeType) {
    throw new Error(`Unsupported asset type: ${extension}`);
  }

  return `data:${mimeType};base64,${file.toString("base64")}`;
}

export async function buildSvgBadges(badgePaths, { width, badgeSize = 40, offset = 20, gap = 10 } = {}) {
  const badges = await Promise.all(badgePaths.map((badgePath) => getAsset(badgePath, true)));
  const totalWidth = badges.length * badgeSize + Math.max(0, badges.length - 1) * gap;
  const startX = width - totalWidth - offset;

  return badges.map((badge, index) => `<image href="${badge}" x="${startX + index * (badgeSize + gap)}" y="${offset}" width="${badgeSize}" height="${badgeSize}" preserveAspectRatio="xMidYMid meet"/>`).join("");
}

export function hasUserFlag(publicFlags, flag) {
  if (!publicFlags) {
    return false;
  }

  return (
    (BigInt(publicFlags) & BigInt(flag)) === BigInt(flag)
  );
}

export function getPremiumBadge(resolvedUser) {
  switch (resolvedUser?.premium_type) {
    case UserPremiumType.Nitro:
    case UserPremiumType.NitroClassic:
      return "discord-nitro.svg";

    case UserPremiumType.NitroBasic:
      return "discord-nitro-basic.svg";

    default:
      return undefined;
  }
}

export function getPublicFlagBadges(resolvedUser) {
  const publicFlags = resolvedUser?.public_flags ?? 0;

  return Object.entries(badgePaths)
    .filter(([flag]) =>
      hasUserFlag(publicFlags, Number(flag)),
    )
    .map(([, path]) => path);
}

export function getUserBadges(resolvedUser, resolvedMember) {
  const badges = [];
  const premiumBadge = getPremiumBadge(resolvedUser);

  if (premiumBadge) {
    badges.push(premiumBadge);
  }

  badges.push(...getPublicFlagBadges(resolvedUser));

  if (resolvedMember?.premium_since) {
    badges.push("boosts/discord-boost-1.svg");
  }

  return [...new Set(badges)];
}
