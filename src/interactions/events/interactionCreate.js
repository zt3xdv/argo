import { GatewayDispatchEvents, InteractionType } from '@discordjs/core';
import { getEmoji } from "../../utils/utils.js";

export default {
  name: GatewayDispatchEvents.InteractionCreate,
  once: false,

  async execute(interaction, client) {
    if (interaction.data?.type !== InteractionType.ApplicationCommand) {
      return;
    }

    const command = client.commands.get(interaction.data?.data?.name);
    if (!command) {
      return;
    }

    try {
      await command.execute(interaction, client);
    } catch (error) {
      console.error(`Error executing /${interaction.data.data.name}:`, error);
      await api.interactions.reply(interaction.id, interaction.token, {
        content: `${getEmoji("wrong", client)} An error ocurred while processing this request.`,
      });
    }
  }
};
