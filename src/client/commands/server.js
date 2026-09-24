import { Resvg } from "@resvg/resvg-wasm";
import { ApplicationCommandType, ApplicationIntegrationType, InteractionContextType, ComponentType, MessageFlags } from "@discordjs/core";
import { getEmoji, formatDiscordDate, escapeXml, escapeMarkdown, getGuildAssetUrl, fetchImage, getSnowflakeDate, truncate } from "../../utils/utils.js";

export default {
  name: "server",
  description: "View information about the current server",
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

  async execute({ data: interaction, api }, client, { customGuildData, shouldReturn } = {}) {
    if (!customGuildData && !interaction.guild_id) {
      await api.interactions.editReply(interaction.application_id, interaction.token, {
        components: [
          {
            type: ComponentType.Container,
            components: [
              {
                type: ComponentType.TextDisplay,
                content: `-# ${getEmoji("exclamation", client)} This command can only be used inside a server.`,
              },
            ],
          },
        ],
        flags: MessageFlags.IsComponentsV2,
      });
      return;
    }

    let guild = customGuildData ?? null;

    try {
      if (!customGuildData) {
        guild = await api.guilds.get(interaction.guild_id, { with_counts: true });
      }
    } catch {
      await api.interactions.editReply(interaction.application_id, interaction.token, {
        components: [
          {
            type: ComponentType.Container,
            components: [
              {
                type: ComponentType.TextDisplay,
                content: `-# ${getEmoji("exclamation", client)} I can't access this server.`,
              },
            ],
          },
        ],
        flags: MessageFlags.IsComponentsV2,
      });
      return;
    }

    let roles = [];
    try {
      if (!customGuildData) {
        roles = await api.guilds.getRoles(guild.id);
      }
    } catch { /* cant access to roles */ }

    const defaultGuildIcon = "https://cdn.discordapp.com/embed/avatars/0.png";

    const iconUrl = getGuildAssetUrl("icons", guild.id, guild.icon, 256) ?? defaultGuildIcon;
    const bannerUrl = getGuildAssetUrl("banners", guild.id, guild.banner, 1024);

    let avatarData;
    try {
      avatarData = await fetchImage(iconUrl);
    } catch {
      avatarData = await fetchImage(defaultGuildIcon);
    }

    let bannerBase64 = null;
    if (bannerUrl) {
      try {
        const bannerData = await fetchImage(bannerUrl);
        bannerBase64 = bannerData.base64;
      } catch {
        bannerBase64 = null;
      }
    }

    const memberCount = guild.approximate_member_count ?? guild.member_count ?? "Unknown";
    const roleCount = roles.length ? Math.max(roles.length - 1, 0) : "Unknown";

    const boostCount = guild.premium_subscription_count ?? 0;
    const boostLevel = guild.premium_tier ?? 0;

    const createdAt = getSnowflakeDate(guild.id);

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

        ${bannerBase64 ? `<image x="-25" y="-25" width="950" height="310" preserveAspectRatio="xMidYMid slice" filter="url(#blur)" mask="url(#bannerMask)" href="data:image/png;base64,${bannerBase64}" xlink:href="data:image/png;base64,${bannerBase64}"/>` : ""}
        <rect width="900" height="260" fill="url(#overlay)"/>

        <image x="40" y="40" width="180" height="180" preserveAspectRatio="xMidYMid slice" clip-path="url(#avatarClip)" href="data:${avatarData.mimeType};base64,${avatarData.base64}" xlink:href="data:${avatarData.mimeType};base64,${avatarData.base64}"/>
        
        <text x="270" y="120" fill="#fff" font-family="Geist" font-size="52" font-weight="700">
          ${escapeXml(truncate(guild.name, 25))}
        </text>

        <text x="270" y="170" fill="#b5bac1" font-family="Geist" font-size="32">
          ${escapeXml(typeof memberCount === "number" ? `${memberCount.toLocaleString("en-US")} members${typeof guild?.approximate_presence_count === "number" ? ` • ${guild.approximate_presence_count.toLocaleString("en-US")} online` : typeof guild?.online_count === "number" ? ` • ${guild.online_count.toLocaleString("en-US")} online` : ""}` : "Unknown members")}
        </text>
      </svg>
    `, {
      font: {
        fontBuffers: client.fontBuffers,
        loadSystemFonts: false
      },
    });
    const png = renderer.render().asPng();
    const payload = { // To use the shouldReturn api dont blame me for doing this bullshit
      files: [
        {
          name: "server.png",
          data: png,
        },
      ],
      components: [
        {
          type: ComponentType.MediaGallery,
          items: [
            {
              media: {
                url: "attachment://server.png",
              },
            },
          ],
        },
        {
          type: ComponentType.Container,
          components: [
            {
              type: ComponentType.TextDisplay,
              content:
                `-# ${getEmoji("discover", client)} **${escapeMarkdown(guild.name)}** \`${guild.id}\` • ${getEmoji("boost", client)} ${boostCount.toLocaleString("en-US")}, level ${boostLevel}` +
                (guild.description ? `\n${guild.description}` : "") +
                `\n\n${getEmoji("calendar", client)} **Created at**: ${formatDiscordDate(createdAt)}` +
                (!customGuildData ?`\n${getEmoji("roles", client)} **Roles**: ${roleCount}` : "") +
                (guild.owner_id ? `\n${getEmoji("owner", client)} **Owner**: <@${guild.owner_id}>` : "") +
                `\n${getEmoji("image", client)} **Assets**: [Server Icon](${iconUrl})${bannerUrl ? ` • [Server Banner](${bannerUrl})` : ""}`
            },
          ],
        },
      ],
      allowed_mentions: {
        parse: [],
      },
      flags: MessageFlags.IsComponentsV2,
    };
    
    if (shouldReturn) {
      return payload;
    }
    await api.interactions.editReply(interaction.application_id, interaction.token, payload);
  },
};
