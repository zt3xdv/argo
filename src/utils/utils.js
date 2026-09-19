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
