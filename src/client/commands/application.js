import { ApplicationCommandType, ApplicationIntegrationType, InteractionContextType, ComponentType, MessageFlags } from "@discordjs/core";
import { getLatency } from "../../utils/rest.js";
import { getEmoji } from "../../utils/utils.js";

export default {
  name: 'application',
  description: 'View this application details',
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
  defer: true,

  async execute({ data: interaction, api, shardId }, client) {
    const app = await client.api.applications.getCurrent();
    const shards = Array.from(client.gateway.shards.values());
    const totalUsers = shards.reduce((total, shard) => {
      return (
        total +
        Array.from(shard.guilds.values()).reduce(
          (guildTotal, guild) => guildTotal + (guild.memberCount ?? 0),
          0
        )
      );
    }, 0);

    await api.interactions.editReply(interaction.application_id, interaction.token, {
      components: [
        {
          type: ComponentType.Container,
          components: [
            {
              type: ComponentType.TextDisplay,
              content: `-# ${getEmoji("bots", client)} **Application Details**\n\n**Guilds**: ${app.approximate_guild_count}\n**Total users**: ${totalUsers}\n**Shards**: ${shards.length}\n**User installations**: ${app.approximate_user_install_count}\n\n-# These fields are aproximated and may not be exact`,
            },
          ],
        },
      ],
      flags: MessageFlags.IsComponentsV2,
    });
  }
};
