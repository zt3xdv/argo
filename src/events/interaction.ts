import { Client, Events, MessageFlags } from "discord.js";
import { TextDisplay } from "../utils/component.ts";
import { getEmoji } from "../utils/emojis.ts";
import { isDeveloper } from "../utils/utils.ts";

export default {
  name: 'interactionCreate',
  eventName: Events.InteractionCreate,

  async execute(interaction: any) {
    const client = interaction.client;
    
    if (interaction.isChatInputCommand() || interaction.isMessageContextMenuCommand()) {
      const command = client.commands.find(c => 
        c.data.name === interaction.commandName || 
        c.data.messageContext?.name === interaction.commandName
      );

      if (!command) return;

      try {
        if (command.dev && !isDeveloper(interaction.user.id)) {
          const text = new TextDisplay({
            content: `${getEmoji("exclamation")} You do not have permissions to do this.`,
          });
    
          await interaction.reply({ components: [text], flags: MessageFlags.IsComponentsV2 });
        } else {
          await command.execute(interaction, client);
        }
      } catch (cmdError) {
        console.error(cmdError);
        
        const text = new TextDisplay({
          content: `${getEmoji("wrong")} An error ocurred while processing command **/${interaction.commandName}**.`,
        });
        const args = { components: [text], flags: MessageFlags.IsComponentsV2 };
        
        if (interaction.deferred) {
          await interaction.editReply(args);
        } else {
          await interaction.reply(args);
        }
      }
    } else if (interaction.isAutocomplete()) {
      const command = client.commands.find(c => c.data.name === interaction.commandName);
      
      if (!command) return;
      
      try {
        if (command.autocomplete) command.autocomplete(interaction, client);
      } catch (e) { console.error(e); }
    }
  },
};
