import { GatewayDispatchEvents, InteractionType } from '@discordjs/core';
import { getEmoji } from '../../utils/utils.js';

export default {
  name: GatewayDispatchEvents.InteractionCreate,
  once: false,

  async execute(interaction, client) {
    if (interaction.data?.type == InteractionType.ApplicationCommand || interaction.data?.type == InteractionType.ApplicationCommandAutocomplete) {
      const command = client.commands.get(interaction.data?.data?.name) || [...client.commands.values()].find(command => command.types?.[interaction.data?.data?.type]?.name === interaction.data?.data?.name);
      if (!command) {
        return;
      }

      try {
        if (interaction.data?.type == InteractionType.ApplicationCommandAutocomplete) {
          await command.autocomplete(interaction, client);
          return;
        }
        
        if (command.defer) {
          await interaction.api.interactions.defer(interaction.data.id, interaction.data.token, typeof command.defer == "object" ? command.defer : {});
        }
        
        await command.execute(interaction, client);
      } catch (error) {
        console.error(`Error executing /${interaction.data.data.name}:`, error);
      }
    }
  }
};
