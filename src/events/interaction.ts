import { Client, Events, MessageFlags, ApplicationCommandType } from "discord.js";
import { TextDisplay } from "../utils/component.ts";
import { getEmoji } from "../utils/emojis.ts";
import { isDeveloper, makeEphemeral } from "../utils/utils.ts";
import { Settings } from "../utils/settings.ts";

export default {
  name: 'interactionCreate',
  eventName: Events.InteractionCreate,

  async execute(interaction: any) {
    const client = interaction.client;
    const isContext = interaction.isUserContextMenuCommand() || interaction.isMessageContextMenuCommand();
    
    if (interaction.isChatInputCommand() || isContext) {
      client.debug("command executed", interaction.commandName, "user", interaction.user.id);
      
      const ephemeralApps = await Settings.get(client.db, interaction.user.id, "ephemeral_apps");
      const ephemeralCommands = await Settings.get(client.db, interaction.user.id, "ephemeral_commands");
      if (ephemeralCommands || (ephemeralApps && isContext)) makeEphemeral(interaction);
      
      const command = client.commands.find(c => {
        const name = isContext ? c.data.context?.name : c.data.name;
        if (name !== interaction.commandName) return false;

        const types = Array.isArray(c.data.type) ? c.data.type : [c.data.type];

        return (interaction.isChatInputCommand() && types.includes(ApplicationCommandType.ChatInput)) ||
               (interaction.isUserContextMenuCommand() && types.includes(ApplicationCommandType.User)) ||
               (interaction.isMessageContextMenuCommand() && types.includes(ApplicationCommandType.Message));
      });

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
