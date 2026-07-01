import { Client, MessageFlags, ApplicationCommandType, ButtonStyle } from "discord.js";
import { TextDisplay, ActionRow, Button, Separator } from "../utils/component.ts";
import { getEmoji } from "../utils/emojis.ts";
import { Container } from "../utils/container.ts";
import { formatTime } from "../utils/utils.ts";

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
      content: `${getEmoji("linked")} Stats`,
    });
    
    const text2 = new TextDisplay({
      content: `> Installations: **${installations}**\n> Users: **${totalUsers}**\n> Uptime: **${formatTime(uptime)}**\n> Memory Usage: **${memoryUsage}mb**\n> Guilds: **${guildCount}**`,
    });
    
    await interaction.editReply({
      components: [
        new Container({ components: [text1, new Separator({ spacing: 2 }), text2] })
      ],
      flags: MessageFlags.IsComponentsV2
    });
  }
};
