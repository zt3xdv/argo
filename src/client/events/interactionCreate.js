import { GatewayDispatchEvents, InteractionType, Routes, InteractionResponseType } from '@discordjs/core';
import database from '../../utils/database.js';
import { buildVoteMessage, getVoteData, twelveHours, remindersKey } from '../handlers/vote.js';
import { getEmoji, addMessage } from '../../utils/utils.js';
import config from "../../../config.json" with { type: "json" };

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
        
        // might change it later
        if (Math.random() < 0.30) {
          await addMessage(interaction.api, `-# ${getEmoji("topgg", client)} Consider voting for us on [Top.gg](https://top.gg/bot/${config.clientId})!`);
        }

        await command.execute(interaction, client);
      } catch (error) {
        console.error(`Error executing /${interaction.data.data.name}:`, error);
      }
    } else if (interaction.data?.type === InteractionType.MessageComponent) {
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
  }
};
