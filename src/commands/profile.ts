import { Client, MessageFlags, UserContextMenuCommandInteraction, ApplicationCommandType } from "discord.js";
import { TextDisplay, Thumbnail, Section } from "../utils/component.ts";
import { Container } from "../utils/container.ts";
import { getEmoji } from "../utils/emojis.ts";
import { FormatTime, getCDN } from "../utils/utils.ts";
import { Timestamp, Pill, StatusToEmoji } from "../utils/markdown.ts";

export default {
  category: "info",
  data: {
    type: [ ApplicationCommandType.ChatInput, ApplicationCommandType.User ],
    options: [
      {
        name: 'user',
        description: 'The user or bot to get info',
        required: false,
        type: 6,
      },
    ],
    name: 'profile',
    description: 'View a user or bot profile',
    context: {
      name: "Profile"
    }
  },
  async execute(interaction: any, client: Client) {
    await interaction.deferReply();
    const isContextInteraction = interaction.isUserContextMenuCommand();
    
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
    
    let badges: string[] = [];
    let status: string = "";
      
    // I need emojis
    /*if (user.flags) {
      for (const flag of user.flags) {
        const allowedFlags = ["staff", "partner", "hypesquad", "bughunterlevel1", "bughunterlevel2", "hypesquadonlinehouse1", "hypesquadonlinehouse2", "hypesquadonlinehouse3", "premiumearlysupporter", "verifiedbot", "verifieddeveloper", "certifiedmoderator"];
        if (allowedFlags.includes(flag.toLowerCase())) badges.push(flag);
      }
    }*/
      
    if (member?.presence) {
      if (member.presence?.status) {
        status = StatusToEmoji(member.presence?.status);
      }
    }
      
    const badgeIcons = badges.map((badge) => getEmoji(badge)).join('');
    
    await interaction.editReply({
      components: [
        new Container({
          components: [
            new Section({
              components: [
                new TextDisplay({
                  content: `${getEmoji("ping")} \`${user.username}\` ${Pill(user.id)} ${getEmoji(status)}\n${badgeIcons}\n_ _`,
                }),
                new TextDisplay({
                  content: `${getEmoji('person')} Display Name\n${member ? member.nick : user.displayName}`,
                }),
                new TextDisplay({
                  content: `${getEmoji('calendar1')} Created\n${Timestamp(user.createdTimestamp, 'D')}`,
                }),
                ...(member ? [
                  new TextDisplay({
                    content: `${getEmoji('newmembers')} Joined\n${Timestamp(member.joined_at ? Date.parse(member.joined_at) : member.joinedTimestamp, 'D')}`,
                  }),
                  ...(member.roles instanceof Array ? [
                    new TextDisplay({
                      content: `${getEmoji('ping')} Roles\n-# ${member.roles.slice(0, 5).map(id => `<@&${id}>`).join(" ")}${member.roles.length > 5 ? ` +${member.roles.length - 5}` : ""}`,
                    })
                  ] : [])
                ] : [])
              ],
              accessory: new Thumbnail({
                url: getCDN(`avatars/${user.id}/${member.avatar}`, 2048, "webm"),
                description: 'Avatar',
              }),
            })
          ]
        })
      ],
      flags: MessageFlags.IsComponentsV2
    });
  }
};
