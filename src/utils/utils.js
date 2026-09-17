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
