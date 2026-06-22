import { Client, MessageFlags, UserContextMenuCommandInteraction, ApplicationCommandType } from "discord.js";
import { TextDisplay, MediaGallery } from "../utils/component.ts";
import { Container } from "../utils/container.ts";
import { getEmoji } from "../utils/emojis.ts";
import { FormatTime, getCDN } from "../utils/utils.ts";
import { Timestamp, Pill, Capitalize, StatusToEmoji } from "../utils/markdown.ts";

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
      {
        name: 'scope',
        description: 'From where should get avatar from',
        choices: [
          {
            name: 'Global',
            value: 'global',
          },
          {
            name: 'Guild',
            value: 'guild',
          },
        ],
        required: false,
        type: 3,
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
    
    const scope = isContextInteraction ? "global" : (interaction.options.getString('scope') || "global");
    const user = isContextInteraction 
      ? interaction.targetUser 
      : (interaction.options.getUser('user') || interaction.user);
    const member = isContextInteraction 
      ? interaction.targetMember 
      : (interaction.options.getMember('user') || interaction.member);
    
    if (!user) {
      await interaction.editReply({
        components: [
          new Container({
            components: [
              new TextDisplay({
                content: `${getEmoji("exclamation")} Please select a valid user`
              })
            ]
          })
        ],
        flags: MessageFlags.IsComponentsV2
      });
      
      return;
    }
    
    if (member && scope == "guild" && !member.avatar) {
      await interaction.editReply({
        components: [
          new Container({
            components: [
              new TextDisplay({
                content: `${getEmoji("exclamation")} <@${user.id}> does not have a guild avatar`
              })
            ]
          })
        ],
        flags: MessageFlags.IsComponentsV2
      });
        
      return;
    }
      
    const getAvatar = (format) => (
      (member && scope == "guild") ?
        getCDN(`guilds/${interaction.guild_id}/users/${user.id}/avatars/${member.avatar}`, 2048, format) :
        getCDN(`avatars/${user.id}/${user.avatar}`, 2048, format)
    );
      
    await interaction.editReply({
      components: [
        new Container({
          components: [
            new TextDisplay({
              content: `-# ${getEmoji("image")} ${user.username} • Avatar`
            }),
            new MediaGallery({
              items: [
                {
                  media: {
                    url: getAvatar("webp")
                  }
                }
              ]
            }),
            new TextDisplay({
              content: `-# [png](${getAvatar('png')}) • [jpg](${getAvatar('jpg')}) • [webp](${getAvatar('webp')})${member?.avatar?.startsWith('a_') ? ` • [gif](${getAvatar('gif')})` : ''}`
            })
          ]
        })
      ],
      flags: MessageFlags.IsComponentsV2
    });
  }
};
