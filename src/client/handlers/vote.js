import { Routes, ComponentType, MessageFlags, ButtonStyle } from '@discordjs/core';
import database from '../../utils/database.js';

async function getVoteData(userId) {
  const data = await database.getItem(`topgg.${userId}`);

  return {
    lastVoteTime: data?.lastVoteTime ?? null,
    totalVotes: data?.totalVotes ?? 0,
    shouldRemindThem: data?.shouldRemindThem ?? true
  };
}

export async function buildVoteMessage(userId) {
  const data = await getVoteData(userId);

  return {
    components: [
      {
        type: ComponentType.TextDisplay,
        content:
          "Thanks for voting for our bot on top.gg!\n\n" +
          `Total votes: **${data.totalVotes}**\n` + 
          data.lastVoteTime ? `Last vote: <t:${Math.floor(new Date(data.lastVoteTime).getTime() / 1000)}:R>` : "This is your first recorded vote."
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
  const currentData = await getVoteData(userId);

  await database.setItem(`topgg.${userId}`, {
    lastVoteTime: new Date().toISOString(),
    totalVotes: currentData.totalVotes + 1,
    shouldRemindThem: currentData.shouldRemindThem
  });

  const channel = await client.rest.post(Routes.userChannels(), {
    body: {
      recipient_id: userId
    }
  });

  await client.rest.post(Routes.channelMessages(channel.id), {
    body: await buildVoteMessage(userId)
  });
}
