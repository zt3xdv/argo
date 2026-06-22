import { Client, MessageFlags, ApplicationCommandType } from "discord.js";
import { TextDisplay } from "../utils/component.ts";
import { Container } from "../utils/container.ts";
import { getEmoji } from "../utils/emojis.ts";

export default {
  category: "info",
  data: {
    type: [ ApplicationCommandType.ChatInput ],
    options: [],
    name: 'ping',
    description: 'Pong!'
  },
  async execute(interaction: any, client: Client) {
    await interaction.deferReply();
    
    const text = new TextDisplay({
      content: `${getEmoji("pings")} **Pong!**\n-# Websocket latency: ${client.ws.ping}ms`,
    });
    
    await interaction.editReply({
      components: [
        new Container({ components: [text] })
      ],
      flags: MessageFlags.IsComponentsV2
    });
  }
};
