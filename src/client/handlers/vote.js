import { Routes, ComponentType, MessageFlags, ButtonStyle } from '@discordjs/core';
import { delay, getEmoji } from "../../utils/utils.js";
import config from "../../../config.json" with { type: "json" };
import database from '../../utils/database.js';

export const remindersKey = 'topgg.reminders';
export const twelveHours = 12 * 60 * 60 * 1000;
export const reminderDelay = 1500;

let processing = false;

async function getReminders() {
  return (await database.getItem(remindersKey)) ?? {};
}

export async function getVoteData(userId) {
  const data = await database.getItem(`topgg.${userId}`);

  return {
    lastVoteTime: data?.lastVoteTime ?? null,
    totalVotes: data?.totalVotes ?? 0,
    shouldRemindThem: data?.shouldRemindThem ?? true
  };
}

export function buildVoteMessage(userId, data, client) {
  const lastVote = data.lastVoteTime
    ? `Last vote: <t:${Math.floor(new Date(data.lastVoteTime).getTime() / 1000)}:R>`
    : 'This is your first recorded vote.';

  return {
    components: [
      {
        type: ComponentType.TextDisplay,
        content:
          `${getEmoji("topgg", client)} Thanks for voting for our bot on [Top.gg](https://top.gg/bot/${config.clientId})!\n\n` +
          `Total votes: **${data.totalVotes}**\n` +
          lastVote
      },
      {
        type: ComponentType.ActionRow,
        components: [
          {
            type: ComponentType.Button,
            style: ButtonStyle.Secondary,
            label: data.shouldRemindThem ? "Don't remind me" : 'Remind me!',
            custom_id: `topgg:toggle-reminder:${userId}`
          }
        ]
      }
    ],
    flags: MessageFlags.IsComponentsV2
  };
}

export async function handleVote(payload, client) {
  const userId = payload.data.user.platform_id;
  const [oldData, reminders] = await Promise.all([
    getVoteData(userId),
    getReminders()
  ]);

  const lastVoteTime = new Date().toISOString();

  const data = {
    ...oldData,
    lastVoteTime,
    totalVotes: oldData.totalVotes + 1
  };

  reminders[userId] = {
    lastVoteTime,
    remindAt: Date.now() + twelveHours
  };

  await Promise.all([
    database.setItem(`topgg.${userId}`, data),
    database.setItem(remindersKey, reminders)
  ]);

  const channel = await client.rest.post(Routes.userChannels(), {
    body: {
      recipient_id: userId
    }
  });

  try {
    await client.rest.post(Routes.channelMessages(channel.id), {
      body: buildVoteMessage(userId, data, client)
    });
  } catch { /* closed dm or others */ }
}

export async function processReminders(client) {
  if (processing) return;

  processing = true;

  try {
    const reminders = await getReminders();

    const dueUsers = Object.entries(reminders).filter(
      ([, reminder]) => reminder.remindAt <= Date.now()
    );

    if (!dueUsers.length) return;

    const sentUsers = [];

    for (let i = 0; i < dueUsers.length; i++) {
      const [userId] = dueUsers[i];

      try {
        const channel = await client.rest.post(Routes.userChannels(), {
          body: {
            recipient_id: userId
          }
        });

        await client.rest.post(Routes.channelMessages(channel.id), {
          body: {
            components: [
              {
                type: ComponentType.TextDisplay,
                content: `${getEmoji("topgg", client)} You can vote for our bot again on [Top.gg](https://top.gg/bot/${config.clientId})!`
              }
            ],
            flags: MessageFlags.IsComponentsV2
          }
        });
      } catch (error) {
        console.error(`Failed to notify ${userId}:`, error);
      }
      
      // prevent loops
      sentUsers.push(userId);
      
      if (i < dueUsers.length - 1) {
        await delay(reminderDelay);
      }
    }

    if (!sentUsers.length) return;

    const latestReminders = await getReminders();

    for (const userId of sentUsers) {
      if (
        latestReminders[userId]?.lastVoteTime ===
        reminders[userId].lastVoteTime
      ) {
        delete latestReminders[userId];
      }
    }

    await database.setItem(remindersKey, latestReminders);
  } finally {
    processing = false;
  }
}

export function startReminderWorker(client) {
  processReminders(client).catch(console.error);

  return setInterval(() => {
    processReminders(client).catch(console.error);
  }, 30000);
}
