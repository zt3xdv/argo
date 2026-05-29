import { Client, Events, MessageFlags, SeparatorSpacingSize } from "discord.js";
import { TextDisplay, Separator } from "../utils/component.ts";
import { getEmoji } from "../utils/emojis.ts";

export default {
  name: 'interactionCreate',
  eventName: Events.InteractionCreate,

  async execute(client: Client, interaction: any) {
    if (interaction.isChatInputCommand()) {
      const command = client.commands.filter(c => c.data.name == interaction.commandName)[0];
      if (!command) return;

      try {
        await command.execute(interaction, client);
      } catch (cmdError) {
        console.error(cmdError);
        
        const text = new TextDisplay({
          content: `${getEmoji("wrong")} An error ocurred while processing command **/${interaction.commandName}**.`,
        });
        const sep = new Separator({
          spacing: SeparatorSpacingSize.Large,
          divider: true,
        });
    
        await interaction.editReply({ components: [text, sep], flags: MessageFlags.IsComponentsV2 });
      }
    }
  },
};
