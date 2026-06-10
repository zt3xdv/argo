import { Client, MessageFlags, UserContextMenuCommandInteraction, ApplicationCommandType } from "discord.js";
import { TextDisplay, Thumbnail, Section } from "../../utils/component.ts";
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

    const targetUser = isContextInteraction 
      ? interaction.targetUser 
      : (interaction.options.getUser('user') || interaction.user);

    const target = await interaction.client.users.fetch(targetUser.id, { force: true });

    let member = null;
    if (target) {
      member = interaction.options.getMember('user') || 
               await interaction.guild.members.fetch(target.id).catch(() => null);

      let badges: string[] = [];
      let status: string = "";
      
      // I need emojis
      /*if (target.flags) {
        for (const flag of target.flags) {
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
      
      const avatar = target.avatarURL?.() ?? target.defaultAvatarURL;

      const text1 = new TextDisplay({
        content: `\`${target.username}\` ${Pill(target.id)} ${status}\n${badgeIcons}\n_ _`,
      });

      const text2 = new TextDisplay({
        content: `${getEmoji('person')} Display Name\n${member ? member.nick : target.displayName}`,
      });
      
      const text3 = new TextDisplay({
        content: `${getEmoji('calendar1')} Created\n${Timestamp(target.createdTimestamp, 'D')}`,
      });

      const thumb = new Thumbnail({
        url: avatar,
        description: 'Avatar',
      });
      
      const set = new Section({
        components: [text1, text2, text3],
        accessory: thumb,
      });

      const container = new Container({ components: [set] });

      if (member) {
        const text4 = new TextDisplay({
          content: `${getEmoji('newmembers')} Joined\n${Timestamp(member.joined_at ? Date.parse(member.joined_at) : member.joinedTimestamp, 'D')}`,
        });

        container.addTextDisplayComponents(text4);
        
        if (member.roles instanceof Array) {
          const text5 = new TextDisplay({
            content: `${getEmoji('ping')} Roles\n-# ${member.roles.slice(0, 5).map(id => `<@&${id}>`).join(" ")}${member.roles.length > 5 ? ` +${member.roles.length - 5}` : ""}`,
          });
          container.addTextDisplayComponents(text5);
        }
      }
      
      await interaction.editReply({ components: [container], flags: MessageFlags.IsComponentsV2 });
    }
  }
};
