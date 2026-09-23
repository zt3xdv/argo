import { UserFlags, UserPremiumType } from "discord-api-types/v10";
import { hasFlag, getAsset } from "./utils.js";

export const badgePaths = {
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

// sorted by value (e. seed is 1, and bud is 3)
export const accountAgeBadges = [
  "seed.svg",
  "sprout.svg",
  "bud.svg",
  "sapling.svg",
  "blossom.svg",
  "redwood.svg",
  "sequoia.svg",
  "bristlecone.svg",
  "primordial.svg",
];

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

export function getAccountAgeBadge(resolvedUser) {
  if (!resolvedUser?.id) return undefined;

  const created = new Date(getSnowflakeDate(resolvedUser.id));
  const now = new Date();

  let age = now.getUTCFullYear() - created.getUTCFullYear();

  if (now.getUTCMonth() < created.getUTCMonth() || (now.getUTCMonth() === created.getUTCMonth() && now.getUTCDate() < created.getUTCDate())) {
    age--;
  }

  if (age < 1) return undefined;

  return `account-age/${accountAgeBadges[Math.min(age, 9) - 1]}`;
}

export function getPublicFlagBadges(resolvedUser) {
  const publicFlags = resolvedUser?.public_flags ?? 0;

  return Object.entries(badgePaths)
    .filter(([flag]) =>
      hasFlag(publicFlags, Number(flag)),
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
  badges.push(getAccountAgeBadge(resolvedUser));

  if (resolvedMember?.premium_since) {
    badges.push("boosts/discord-boost-1.svg");
  }

  return [...new Set(badges)];
}

export async function buildSvgBadges(badgePaths, { width, badgeSize = 40, offset = 20, gap = 10 } = {}) {
  const badges = await Promise.all(badgePaths.map((badgePath) => getAsset(badgePath, true)));
  const totalWidth = badges.length * badgeSize + Math.max(0, badges.length - 1) * gap;
  const startX = width - totalWidth - offset;

  return badges.map((badge, index) => `<image href="${badge}" x="${startX + index * (badgeSize + gap)}" y="${offset}" width="${badgeSize}" height="${badgeSize}" preserveAspectRatio="xMidYMid meet"/>`).join("");
}
