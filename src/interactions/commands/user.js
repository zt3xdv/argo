import path from "node:path";
import { Resvg } from "@resvg/resvg-wasm";
import { ApplicationCommandOptionType, ApplicationCommandType, ApplicationIntegrationType, InteractionContextType, ComponentType, MessageFlags } from "@discordjs/core";
import { getEmoji, formatDiscordDate, escapeXml } from "../../utils/utils.js";
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
    const isUserContextMenu = interaction.data.type === ApplicationCommandType.User;
    const selectedUserId = isUserContextMenu ? interaction.data.target_id : interaction.data.options?.find((option) => option.type === ApplicationCommandOptionType.User && option.name === "user")?.value;

    const interactionUser = interaction.member?.user ?? interaction.user;
    const interactionUserId = interactionUser?.id;

    const userId = selectedUserId ?? interactionUserId;
    const isInteractionUser = userId === interactionUserId;

    const resolvedUser = interaction.data.resolved?.users?.[userId] ?? (isInteractionUser ? interactionUser : await client.api.users.get(userId));
    const resolvedMember = interaction.data.resolved?.members?.[userId] ?? (isInteractionUser ? interaction.member : undefined);

    const roleIds = resolvedMember?.roles ?? [];
    const guildRoles = interaction.guild_id ? await api.guilds.getRoles(interaction.guild_id) : [];

    const roles = roleIds.map((id) => guildRoles.find((role) => role.id === id)).filter(Boolean).sort((a, b) => b.position - a.position);
    const visibleRoles = roles.slice(0, 5).map((role) => `<@&${role.id}>`);
    const remainingRoles = Math.max(roles.length - 5, 0);

    const rolesText = resolvedMember ? [
      `${getEmoji("roles", client)} **Roles (${roles.length})**`,
      visibleRoles.length ? visibleRoles.join(", ") : "There are no roles",
      remainingRoles > 0 ? `\`+${remainingRoles}\`` : null
    ].filter(Boolean).join("\n") : null;

    const displayName = resolvedMember?.nick ?? (resolvedUser.global_name ?? resolvedUser.username);
    
    const avatarResponse = await fetch(resolvedUser.avatar ? `https://cdn.discordapp.com/avatars/${userId}/${resolvedUser.avatar}.png?size=256` : `https://cdn.discordapp.com/embed/avatars/${Number(BigInt(userId) >> 22n) % 6}.png`);

    if (!avatarResponse.ok) {
      throw new Error(`Failed to fetch avatar: ${avatarResponse.status}`);
    }

    const avatarMimeType = avatarResponse.headers.get("content-type") ?? "image/png";
    const avatarBase64 = Buffer.from(await avatarResponse.arrayBuffer()).toString("base64");

    const renderer = new Resvg(`
      <svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="900" height="260" viewBox="0 0 900 260">
        <defs>
          <clipPath id="avatar-clip">
            <circle cx="130" cy="130" r="90" />
          </clipPath>
        </defs>

        <image x="40" y="40" width="180" height="180" preserveAspectRatio="xMidYMid slice" clip-path="url(#avatar-clip)" href="data:${avatarMimeType};base64,${avatarBase64}" xlink:href="data:${avatarMimeType};base64,${avatarBase64}"/>

        <text x="270" y="120" fill="#ffffff" font-family="Geist" font-size="52" font-weight="700">
          ${escapeXml(displayName.length > 28 ? `${displayName.slice(0, 27)}...` : displayName)}
        </text>

        <text x="270" y="170" fill="#b5bac1" font-family="Geist" font-size="32" font-weight="400">
          @${escapeXml(resolvedUser.username.length > 32 ? `${resolvedUser.username.slice(0, 31)}...` : resolvedUser.username)}
        </text>
      </svg>
    `, {
      font: {
        fontBuffers: client.fontBuffers,
        loadSystemFonts: false,
      },
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
                `-# ${getEmoji("person", client)} **${displayName}** @${resolvedUser.username} \`${userId}\`\n` +
                (resolvedMember?.joined_at ? `\n${getEmoji("newmembers", client)} **Joined at**: ${formatDiscordDate(resolvedMember.joined_at)}` : "") +
                (resolvedUser?.created_at ? `\n${getEmoji("calender", client)} **Created at**: ${formatDiscordDate(resolvedUser.created_at)}` : "") +
                (rolesText ? `\n${rolesText}` : "")
            },
          ],
        },
      ],
      allowedMentions: {
        parse: []
      },
      flags: MessageFlags.IsComponentsV2,
    });
  },
};
