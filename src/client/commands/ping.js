import { ApplicationCommandType, ApplicationIntegrationType, InteractionContextType, MessageFlags, ComponentType } from "@discordjs/core";
import { getEmoji, getRestLatency } from "../../utils/utils.js";

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
    const rest = await getRestLatency(client.rest);
    await api.interactions.reply(interaction.id, interaction.token, {
      components: [
        {
          type: ComponentType.TextDisplay,
          content: `${getEmoji("pings", client)} Pong!\n-# Websocket (Shard #${shardId}) **${client.gateway.shards.get(shardId)?.ping}ms** • REST **${rest}ms**`,
        },
      ],
      flags: MessageFlags.IsComponentsV2,
    });
  }
};
