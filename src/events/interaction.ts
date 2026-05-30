import { Client, Events, MessageFlags, SeparatorSpacingSize } from "discord.js";
import { TextDisplay, Separator } from "../utils/component.ts";
import { getEmoji } from "../utils/emojis.ts";

export default {
  name: 'interactionCreate',
  eventName: Events.InteractionCreate,

  async execute(interaction: any) {
    const client = interaction.client;
    const sep = new Separator({
      spacing: SeparatorSpacingSize.Large,
      divider: true,
    });
    
    if (interaction.isChatInputCommand()) {
      const command = client.commands.filter(c => c.data.name == interaction.commandName)[0];
      if (!command) return;

      try {
        if (command.dev && !isDeveloper(interaction.user.id)) {
          const text = new TextDisplay({
            content: `${getEmoji("wrong")} You do not have permissions to do this.`,
          });
    
          await interaction.reply({ components: [text, sep], flags: MessageFlags.IsComponentsV2 });
        } else {
          await command.execute(interaction, client);
        }
      } catch (cmdError) {
        console.error(cmdError);
        
        const text = new TextDisplay({
          content: `${getEmoji("wrong")} An error ocurred while processing command **/${interaction.commandName}**.`,
        });
        const args = { components: [text, sep], flags: MessageFlags.IsComponentsV2 };
        
        if (interaction.deferred) {
          await interaction.editReply(args);
        } else {
          await interaction.reply(args);
        }
      }
    }
  },
};
