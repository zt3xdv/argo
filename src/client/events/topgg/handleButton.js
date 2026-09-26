import { GatewayDispatchEvents, InteractionType, Routes, InteractionResponseType } from '@discordjs/core';
import database from '../../../utils/database.js';
import { buildVoteMessage, getVoteData, twelveHours, remindersKey } from '../../handlers/vote.js';

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

    const buttonUserId = customId.split(':').at(-1);

    if (!userId || userId !== buttonUserId) {
      return;
    }

    const [data, storedReminders] = await Promise.all([
      getVoteData(userId),
      database.getItem(remindersKey)
    ]);

    const reminders = storedReminders ?? {};

    const newData = {
      ...data,
      shouldRemindThem: !data.shouldRemindThem
    };

    if (newData.shouldRemindThem && data.lastVoteTime) {
      reminders[userId] = {
        lastVoteTime: data.lastVoteTime,
        remindAt: Date.now() + twelveHours
      };
    } else {
      delete reminders[userId];
    }

    await Promise.all([database.setItem(`topgg.${userId}`, newData), database.setItem(remindersKey, reminders)]);

    await client.rest.post(Routes.interactionCallback(interaction.data.id, interaction.data.token), {
      body: {
        type: InteractionResponseType.UpdateMessage,
        data: buildVoteMessage(userId, newData, client)
      }
    });
  }
};
