import { UserFlags, UserPremiumType } from "discord-api-types/v10";
import { hasFlag, getAsset, getSnowflakeDate } from "./utils.js";

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

  // Account age
  "account-age-1": "account-age/seed.svg",
  "account-age-2": "account-age/sprout.svg",
  "account-age-3": "account-age/bud.svg",
  "account-age-4": "account-age/sapling.svg",
  "account-age-5": "account-age/blossom.svg",
  "account-age-6": "account-age/redwood.svg",
  "account-age-7": "account-age/sequoia.svg",
  "account-age-8": "account-age/bristlecone.svg",
  "account-age-9": "account-age/primordial.svg",

  // Premium
  "nitro": "discord-nitro.svg",
  "nitro-basic": "discord-nitro-basic.svg",

  boost(type) {
    return `boosts/discord-boost-${type}.svg`;
  },
};

const publicFlagPaths = Object.fromEntries(
  Object.entries(badgePaths).filter(([flag, path]) =>
    /^\d+$/.test(flag) && typeof path === "string",
  ),
);

export function getPremiumBadge(resolvedUser) {
  switch (resolvedUser?.premium_type) {
    case UserPremiumType.Nitro:
    case UserPremiumType.NitroClassic:
      return badgePaths["nitro"];

    case UserPremiumType.NitroBasic:
      return badgePaths["nitro-basic"];

    default:
      return undefined;
  }
}

export function getAccountAgeBadge(resolvedUser) {
  if (!resolvedUser?.id) return undefined;

  const created = new Date(getSnowflakeDate(resolvedUser.id));
  const now = new Date();

  let age = now.getUTCFullYear() - created.getUTCFullYear();

  if (
    now.getUTCMonth() < created.getUTCMonth() ||
    (
      now.getUTCMonth() === created.getUTCMonth() &&
      now.getUTCDate() < created.getUTCDate()
    )
  ) {
    age--;
  }

  if (age < 1) return undefined;

  return badgePaths[`account-age-${Math.min(age, 9)}`];
}

export function getPublicFlagBadges(resolvedUser) {
  const publicFlags = resolvedUser?.public_flags ?? 0;

  return Object.entries(publicFlagPaths)
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

  const accountAgeBadge = getAccountAgeBadge(resolvedUser);

  if (accountAgeBadge) {
    badges.push(accountAgeBadge);
  }

  if (resolvedMember?.premium_since) {
    badges.push(badgePaths.boost("1"));
  }

  return [...new Set(badges)];
}

export async function buildSvgBadges(badgePaths, { width, badgeSize = 40, offset = 20, gap = 10 } = {}) {
  const badges = await Promise.all(badgePaths.map((badgePath) => getAsset(badgePath, true)));
  const totalWidth = badges.length * badgeSize + Math.max(0, badges.length - 1) * gap;
  const startX = width - totalWidth - offset;

  return badges.map((badge, index) => `<image href="${badge}" x="${startX + index * (badgeSize + gap)}" y="${offset}" width="${badgeSize}" height="${badgeSize}" preserveAspectRatio="xMidYMid meet"/>`).join("");
}
