export default {
  name: 'ping',
  description: 'Pong!',
  type: 1,

  async execute({ data: interaction, api, shardId }, client) {
    await api.interactions.reply(interaction.id, interaction.token, {
      content: `Pong!\n-# my ping is ${client.gateway.shards.get(shardId)?.ping}ms ig`,
    });
  }
};
