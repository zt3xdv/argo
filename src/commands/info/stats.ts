import { Client, MessageFlags, SeparatorSpacingSize } from "discord.js";
import { TextDisplay, Separator } from "../../utils/component.ts";
import { getEmoji } from "../../utils/emojis.ts";
import { FormatTime } from "../../utils/utils.ts";

export default {
  category: "info",
  data: {
    options: [],
    name: 'stats',
    description: 'Overall Bot stats',
    type: 1
  },
  async execute(interaction: any, client: Client) {
    await interaction.deferReply();
    
    const app = await interaction.client.application?.fetch();
    const installations = app?.approximateUserInstallCount;
    const uptime = Math.floor(process.uptime() * 1000);
    const memoryUsage = (process.memoryUsage().rss / 1024 / 1024).toFixed(2);
    const guildCount = interaction.client?.guilds?.cache?.size ?? (interaction.guild ? 1 : 0);
    
    const text = new TextDisplay({
      content: `${getEmoji("clock")} This bot has been online **${FormatTime(uptime)}**!\n-# Current memory usage: **${memoryUsage}mb**\n\n${getEmoji("generalinfo")} This bot is also on **${guildCount}** guilds and has been installed by **${installations}** users!`,
    });
    const sep = new Separator({
      spacing: SeparatorSpacingSize.Large,
      divider: true,
    });
    
    await interaction.editReply({ components: [text, sep], flags: MessageFlags.IsComponentsV2 });
  }
};
