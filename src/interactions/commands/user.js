import path from "node:path";
import { Resvg } from "@resvg/resvg-wasm";
import { ApplicationCommandOptionType, ApplicationCommandType, ApplicationIntegrationType, InteractionContextType, ComponentType, MessageFlags } from "@discordjs/core";
import { getEmoji, formatDiscordDate, escapeXml, fetchImage } from "../../utils/utils.js";
import { UserFlags } from 'discord-api-types/v10';

export default {
  name: "user",
  description: "View a user's profile",
  types: {
    [ApplicationCommandType.User]: {
      name: "View User Info"
    }
  },
  integrationTypes: [
    ApplicationIntegrationType.GuildInstall,
    ApplicationIntegrationType.UserInstall,
  ],
  contexts: [
    InteractionContextType.BotDM,
    InteractionContextType.Guild,
    InteractionContextType.PrivateChannel,
  ],
  type: ApplicationCommandType.ChatInput,
  defer: true,
  options: [
    {
      name: "user",
      description: "The user to view",
      type: ApplicationCommandOptionType.User,
      required: false,
    },
  ],

  async execute({ data: interaction, api }, client) {
    const selectedUserId = interaction.data.type === ApplicationCommandType.User ? interaction.data.target_id : interaction.data.options?.find((option) => option.name === "user")?.value;
    const interactionUser = interaction.member?.user ?? interaction.user;
    
    const userId = selectedUserId ?? interactionUser?.id;
    const isInteractionUser = userId === interactionUser?.id;

    const resolvedUser = await client.api.users.get(userId);
    const resolvedMember = interaction.data.resolved?.members?.[userId] ?? (isInteractionUser ? interaction.member : undefined);

    const roleIds = resolvedMember?.roles ?? [];
    let guildRoles = [];

    if (interaction.guild_id) {
      try {
        guildRoles = await api.guilds.getRoles(interaction.guild_id);
      } catch { /* no access to guild roles */ }
    }

    const roles = guildRoles.length ? roleIds.map((id) => guildRoles.find((role) => role.id === id)).filter(Boolean).sort((a, b) => b.position - a.position) : roleIds.map((id) => ({ id }));

    const visibleRoles = roles.slice(0, 5).map((role) => `<@&${role.id}>`);
    const remainingRoles = Math.max(roles.length - 5, 0);
    const rolesText = resolvedMember ? [
      `${getEmoji("roles", client)} **Roles (${roles.length})**:`,
      (visibleRoles.length ? "_ _    " + (visibleRoles.join(", ")) : "-# This user has no roles!") + (remainingRoles > 0 ? ` \`+${remainingRoles}\`` : ""),
    ].join("\n") : null;

    const displayName = resolvedMember?.nick ?? (resolvedUser.global_name ?? resolvedUser.username);
    const discriminator = resolvedUser.discriminator != "0" ? "#" + resolvedUser.discriminator : "";
    
    const avatarHash = resolvedMember?.avatar ?? resolvedUser.avatar;
    const avatarData = await fetchImage(avatarHash ? `https://cdn.discordapp.com/avatars/${userId}/${avatarHash}.png?size=256` : `https://cdn.discordapp.com/embed/avatars/${Number(BigInt(userId) >> 22n) % 6}.png`);

    const decorationAsset = resolvedUser.avatar_decoration_data?.asset;
    let avatarDecorationData = null;
    
    if (decorationAsset) {
      try {
        avatarDecorationData = await fetchImage(`https://cdn.discordapp.com/avatar-decoration-presets/${decorationAsset}.png?size=256`);
      } catch { /* could not get decoration */ }
    }
    
    const bannerHash = resolvedMember?.banner || resolvedUser?.banner;
    let bannerData = null;
    
    if (bannerHash) {
      try {
        bannerData = await fetchImage(`https://cdn.discordapp.com/banners/${userId}/${bannerHash}.png?size=1024`);
      } catch { /* could not get banner */ }
    }

    const renderer = new Resvg(`
      <svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="900" height="260" viewBox="0 0 900 260">
        <defs>
          <filter id="blur" x="-20%" y="-30%" width="140%" height="160%">
            <feGaussianBlur stdDeviation="18"/>
          </filter>

          <linearGradient id="maskGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stop-color="black"/>
            <stop offset="55%" stop-color="white" stop-opacity=".65"/>
            <stop offset="100%" stop-color="white"/>
          </linearGradient>

          <mask id="bannerMask">
            <rect width="900" height="260" fill="url(#maskGradient)"/>
          </mask>

          <linearGradient id="overlay" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stop-color="#000" stop-opacity="0"/>
            <stop offset="100%" stop-color="#000" stop-opacity=".25"/>
          </linearGradient>

          <clipPath id="avatarClip">
            <circle cx="130" cy="130" r="90"/>
          </clipPath>
        </defs>

        ${bannerData ? `<image x="-25" y="-25" width="950" height="310" preserveAspectRatio="xMidYMid slice" filter="url(#blur)" mask="url(#bannerMask)" href="data:image/png;base64,${bannerData.base64}" xlink:href="data:image/png;base64,${bannerData.base64}"/>
        <rect width="900" height="260" fill="url(#overlay)"/>` : ""}

        <image x="40" y="40" width="180" height="180" preserveAspectRatio="xMidYMid slice" clip-path="url(#avatarClip)" href="data:${avatarData.mimeType};base64,${avatarData.base64}" xlink:href="data:${avatarData.mimeType};base64,${avatarData.base64}"/>

        ${avatarDecorationData ? `<image x="20" y="20" width="220" height="220" preserveAspectRatio="xMidYMid meet" href="data:${avatarDecorationData.mimeType};base64,${avatarDecorationData.base64}" xlink:href="data:${avatarDecorationData.mimeType};base64,${avatarDecorationData.base64}"/>` : ""}

        <text x="270" y="120" fill="#fff" font-family="Geist" font-size="52" font-weight="700">
          ${escapeXml(displayName.length > 24 ? `${displayName.slice(0, 23)}...` : displayName)}
        </text>

        <text x="270" y="170" fill="#b5bac1" font-family="Geist" font-size="32">
          @${escapeXml(resolvedUser.username.length > 32 ? `${resolvedUser.username.slice(0, 31)}...` : resolvedUser.username)}${discriminator}
        </text>
      </svg>
    `, {
      font: {
        fontBuffers: client.fontBuffers,
        loadSystemFonts: false
      }
    });
    const png = renderer.render().asPng();
    
    await api.interactions.editReply(interaction.application_id, interaction.token, {
      files: [
        {
          name: "user.png",
          data: png,
        },
      ],
      components: [
        {
          type: ComponentType.Container,
          components: [
            {
              type: ComponentType.MediaGallery,
              items: [
                {
                  media: {
                    url: "attachment://user.png",
                  },
                },
              ],
            },
            {
              type: ComponentType.TextDisplay,
              content:
                `-# ${getEmoji("person", client)} **${displayName}** @${resolvedUser.username}${discriminator} \`${userId}\`\n` +
                (resolvedMember?.joined_at ? `\n${getEmoji("newmembers", client)} **Joined at**: ${formatDiscordDate(resolvedMember.joined_at)}` : "") +
                (resolvedUser?.created_at ? `\n${getEmoji("calender", client)} **Created at**: ${formatDiscordDate(resolvedUser.created_at)}` : "") +
                (rolesText ? `\n${rolesText}` : "")
            },
          ],
        },
      ],
      allowed_mentions: {
        parse: []
      },
      flags: MessageFlags.IsComponentsV2,
    });
  },
};
