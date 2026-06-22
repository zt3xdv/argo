import { Client, MessageFlags, ApplicationCommandType, ButtonStyle } from "discord.js";
import { TextDisplay, ActionRow, Button } from "../utils/component.ts";
import { getEmoji } from "../utils/emojis.ts";
import { Container } from "../utils/container.ts";

export default {
  category: "info",
  data: {
    type: [ ApplicationCommandType.ChatInput ],
    options: [],
    name: 'help',
    description: 'Info about Argo'
  },
  async execute(interaction: any, client: Client) {
    await interaction.deferReply();
    
    const text1 = new TextDisplay({
      content: `-# ${getEmoji("discover")} Help`,
    });
    
    const text2 = new TextDisplay({
      content: `Argo is a Discord bot with utility and fun commands.\n\nYou can view my commands at the [website](https://argo.scwah.lol)`,
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
