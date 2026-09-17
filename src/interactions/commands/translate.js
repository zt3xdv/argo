import { ApplicationCommandType, ApplicationIntegrationType, InteractionContextType, ApplicationCommandOptionType } from "@discordjs/core";
import { getLatency } from "../../utils/rest.js";
import { getEmoji } from "../../utils/utils.js";

export default {
  name: 'ping',
  description: 'Pong!',
  integrationTypes: [
    ApplicationIntegrationType.GuildInstall,
    ApplicationIntegrationType.UserInstall
  ],
  contexts: [
    InteractionContextType.BotDM,
    InteractionContextType.Guild,
    InteractionContextType.PrivateChannel
  ],
  type: ApplicationCommandType.ChatInput,

  async execute({ data: interaction, api, shardId }, client) {
    const rest = await getLatency(client.rest);
    await api.interactions.reply(interaction.id, interaction.token, {
      content: `${getEmoji("pings", client)} Pong!\n-# **Websocket (Shard #${shardId}) ${client.gateway.shards.get(shardId)?.ping}ms • REST ${rest}ms**`,
    });
  }
};
