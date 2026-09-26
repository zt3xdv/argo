import { GatewayDispatchEvents, InteractionType, Routes, InteractionResponseType } from '@discordjs/core';
import database from '../../utils/database.js';
import { buildVoteMessage, getVoteData } from '../handlers/vote.js';

export default {
  name: GatewayDispatchEvents.InteractionCreate,
  once: false,

  async execute(interaction, client) {
    if (interaction.data?.type !== InteractionType.MessageComponent) {
      return;
    }

    const customId = interaction.data.data?.custom_id;

    if (!customId?.startsWith('topgg:toggle-reminder:')) {
      return;
    }

    const userId = interaction.data.user?.id || interaction.data.member?.user?.id;
    const buttonUserId = customId.split(':').pop();

    if (!userId || userId !== buttonUserId) {
      return;
    }

    const data = await getVoteData(userId);

    await database.setItem(`topgg.${userId}`, {
      lastVoteTime: data.lastVoteTime,
      totalVotes: data.totalVotes,
      shouldRemindThem: !data.shouldRemindThem
    });

    await client.rest.post(Routes.interactionCallback(interaction.data.id, interaction.data.token), {
      body: {
        type: InteractionResponseType.UpdateMessage,
        data: await buildVoteMessage(userId)
      }
    });
  }
};
