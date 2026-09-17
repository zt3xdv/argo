import { GatewayDispatchEvents, InteractionType } from '@discordjs/core';
import { getEmoji } from '../../utils/utils.js';

export default {
  name: GatewayDispatchEvents.InteractionCreate,
  once: false,

  async execute(interaction, client) {
    if (interaction.data?.type == InteractionType.ApplicationCommand || interaction.data?.type == InteractionType.ApplicationCommandAutocomplete) {
      const command = client.commands.get(interaction.data?.data?.name);
      if (!command) {
        return;
      }

      try {
        if (interaction.data?.type == InteractionType.ApplicationCommandAutocomplete) {
          await command.autocomplete(interaction, client);
          return;
        }

        await command.execute(interaction, client);
      } catch (error) {
        console.error(`Error executing /${interaction.data.data.name}:`, error);
      }
    }
  }
};
