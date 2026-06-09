import { Client, MessageFlags } from "discord.js";
import { TextDisplay } from "../../utils/component.ts";
import { getEmoji } from "../../utils/emojis.ts";
import { isDeveloper } from "../../utils/utils.ts";

export default {
  category: "core",
  data: {
    options: [],
    name: 'restart',
    description: 'Restart the bot server',
    type: 1
  },
  dev: true,
  async execute(interaction: any, client: Client) {
    await interaction.deferReply();
    
    const text = new TextDisplay({
      content: `${getEmoji("loop")} Restarting bot...`,
    });
    
    await interaction.editReply({ components: [text], flags: MessageFlags.IsComponentsV2 });
    
    process.exit();
  }
};
