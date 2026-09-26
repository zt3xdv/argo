import { Routes } from "@discordjs/core";

export async function handleVote(payload, client) {
  const channel = await client.rest.post(Routes.userChannels(), {
    body: {
      recipient_id: payload.data.user.platform_id,
    },
  });

  await client.rest.post(
    Routes.channelMessages(channel.id),
    {
      body: {
        content: "hello, i think you voted so i has to send this message",
      },
    },
  );
}
