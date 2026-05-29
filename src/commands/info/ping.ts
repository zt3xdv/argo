import { Client, MessageFlags, SeparatorSpacingSize } from "discord.js";
import { TextDisplay, Separator } from "../../utils/component.ts";
import { getEmoji } from "../../utils/emojis.ts";

export default {
  category: "info",
  data: {
    options: [],
    name: 'ping',
    description: 'Pong!',
    type: 1
  },
  async execute(interaction: any, client: Client) {
    await interaction.deferReply();
    
    const text = new TextDisplay({
      content: `${getEmoji("pings")} **Pong!**\n-# Websocket latency: ${client.ws.ping}ms`,
    });
    const sep = new Separator({
      spacing: SeparatorSpacingSize.Large,
      divider: true,
    });
    
    await interaction.editReply({ components: [text, sep], flags: MessageFlags.IsComponentsV2 });
  }
};
