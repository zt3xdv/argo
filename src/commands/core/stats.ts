import { Client, MessageFlags, ApplicationCommandType, ButtonStyle } from "discord.js";
import { TextDisplay, ActionRow, Button } from "../../utils/component.ts";
import { getEmoji } from "../../utils/emojis.ts";
import { Container } from "../../utils/container.ts";
import { FormatTime } from "../../utils/utils.ts";

export default {
  category: "core",
  data: {
    type: [ ApplicationCommandType.ChatInput ],
    options: [],
    name: 'stats',
    description: 'Overall bot stats'
  },
  async execute(interaction: any, client: Client) {
    await interaction.deferReply();
    
    const app = await interaction.client.application?.fetch();
    const installations = app?.approximateUserInstallCount;
    const uptime = Math.floor(process.uptime() * 1000);
    const memoryUsage = (process.memoryUsage().rss / 1024 / 1024).toFixed(2);
    const guildCount = interaction.client?.guilds?.cache?.size ?? (interaction.guild ? 1 : 0);
    const totalUsers = interaction.client?.guilds?.cache?.reduce((acc, guild) => acc + guild.memberCount, 0);

    const text1 = new TextDisplay({
      content: `## Argo Discord Bot\n-# Bot status`,
    });
    
    const text2 = new TextDisplay({
      content: `### Overall\n> Installations: **${installations}**\n> Users: **${totalUsers}**\n> Uptime: **${FormatTime(uptime)}**\n> Memory Usage: **${memoryUsage}mb**\n> Guilds: **${guildCount}**`,
    });
    
    const button = new Button({
      text: "Invite Me",
      url: `https://discord.com/oauth2/authorize?client_id=${process.env.CLIENT_ID}`,
      color: ButtonStyle.Link
    });
    
    const button2 = new Button({
      text: "Support Server",
      url: "https://discord.gg/mqt2ZTquF9",
      color: ButtonStyle.Link
    });
    
    const actionRow = new ActionRow(button, button2);
    
    await interaction.editReply({
      components: [
        new Container({ components: [text1, text2, actionRow] })
      ],
      flags: MessageFlags.IsComponentsV2
    });
  }
};
