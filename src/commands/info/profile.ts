import { Client, MessageFlags, MessageContextMenuCommandInteraction } from "discord.js";
import { TextDisplay, Thumbnail, Section } from "../../utils/component.ts";
import { Container } from "../../utils/container.ts";
import { getEmoji } from "../../utils/emojis.ts";
import { FormatTime } from "../../utils/utils.ts";
import { Timestamp, Pill, Capitalize, StatusToEmoji } from "../../utils/markdown.ts";

export default {
  category: "info",
  data: {
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
    type: 1,
    messageContext: {
      name: "Profile"
    }
  },
  async execute(interaction: any, client: Client) {
    await interaction.deferReply();
    const isContextInteraction = interaction instanceof MessageContextMenuCommandInteraction;
    
    const target = await interaction.client.users.fetch(isContextInteraction ? interaction.options.getMessage("message").author : (interaction.options.getUser('user')?.id || interaction.user.id), {
      force: true,
    });
    
    if (target) {
      const member = await interaction.guild?.members.fetch(target.id).catch(() => null);
      
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
        content: `\`${target.username}\` ${Pill(target.id)} ${getEmoji(status)}\n${badgeIcons}\n_ _`,
      });

      const text2 = new TextDisplay({
        content: `${getEmoji('person')} Display Name\n${member ? member.displayName : target.displayName}`,
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
          content: `${getEmoji('newmembers')} Joined at ${Timestamp(member.joinedTimestamp, 'D')}`,
        });

        container.addTextDisplayComponents(text4);
      }
      
      await interaction.editReply({ components: [container], flags: MessageFlags.IsComponentsV2 });
    }
  }
};
