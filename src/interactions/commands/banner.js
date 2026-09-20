import { ApplicationCommandOptionType, ApplicationCommandType, ApplicationIntegrationType, InteractionContextType, ComponentType, MessageFlags } from "@discordjs/core";
import { getEmoji } from "../../utils/utils.js";

export default {
  name: "banner",
  description: "View a user's banner",
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
      description: "The user whose banner you want to view",
      type: ApplicationCommandOptionType.User,
      required: false,
    },
  ],

  async execute({ data: interaction }, client) {
    const interactionUser = interaction.member?.user ?? interaction.user;
    const selectedUserId = interaction.data.options?.find((option) => option.name === "user")?.value;

    const userId = selectedUserId ?? interactionUser.id;
    const user = await client.api.users.get(userId);

    if (!user.banner) {
      await client.api.interactions.editReply(interaction.application_id, interaction.token, {
        components: [
          {
            type: ComponentType.TextDisplay,
            content: `-# ${getEmoji("exclamation", client)} This user does not have a banner.`,
          },
        ],
        flags: MessageFlags.IsComponentsV2,
      });
      return;
    }

    const isAnimated = user.banner?.startsWith("a_");

    const baseUrl = `https://cdn.discordapp.com/banners/${userId}/${user.banner}`;
    const links = [`[PNG](${baseUrl}.png?size=4096)`, ...(user.banner ? [`[WEBP](${baseUrl}.webp?size=4096)`, `[JPG](${baseUrl}.jpg?size=4096)`] : []), ...(isAnimated ? [`[GIF](${baseUrl}.gif?size=4096)`] : [])].join(" • ");

    await client.api.interactions.editReply(interaction.application_id, interaction.token, {
      components: [
        {
          type: ComponentType.Container,
          components: [
            {
              type: ComponentType.MediaGallery,
              items: [
                {
                  media: {
                    url: isAnimated ? `${baseUrl}.gif?size=4096` : `${baseUrl}.png?size=4096`,
                  },
                },
              ],
            },
            {
              type: ComponentType.TextDisplay,
              content: `-# ${getEmoji("image", client)} **${user.global_name ?? user.username}'s Banner**\n` + links
            },
          ],
        },
      ],
      allowedMentions: {
        parse: [],
      },
      flags: MessageFlags.IsComponentsV2,
    });
  },
};
