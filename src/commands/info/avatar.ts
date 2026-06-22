import { Client, MessageFlags, UserContextMenuCommandInteraction, ApplicationCommandType } from "discord.js";
import { TextDisplay, MediaGallery } from "../../utils/component.ts";
import { Container } from "../../utils/container.ts";
import { getEmoji } from "../../utils/emojis.ts";
import { FormatTime } from "../../utils/utils.ts";
import { Timestamp, Pill, Capitalize, StatusToEmoji } from "../../utils/markdown.ts";

export default {
  category: "info",
  data: {
    type: [ ApplicationCommandType.ChatInput, ApplicationCommandType.User ],
    options: [
      {
        name: 'user',
        description: 'The user or bot to get the avatar',
        required: false,
        type: 6,
      },
    ],
    name: 'avatar',
    description: 'View a user or bot svatar',
    context: {
      name: "Avatar"
    }
  },
  async execute(interaction: any, client: Client) {
    await interaction.deferReply();
    const isContextInteraction = interaction.isUserContextMenuCommand();
    const targetUser = isContextInteraction 
      ? interaction.targetUser 
      : (interaction.options.getUser('user') || interaction.user);
    const target = await interaction.client.users.fetch(targetUser.id, { force: true });

    const avatar = target.avatarURL?.() ?? target.defaultAvatarURL;

    await interaction.editReply({
      components: [
        new Container({
          components: [
            new MediaGallery({
              items: [
                media: {
                  url: avatar
                },
                description: "Avatar"
              ]
            })
          ]
        })
      ],
      flags: MessageFlags.IsComponentsV2
    });
  }
};
