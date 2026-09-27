import { GatewayDispatchEvents } from '@discordjs/core';

export default {
  name: GatewayDispatchEvents.GuildCreate,
  once: false,
  
  async execute({ data: guild, shardId }, client) {
    if (guild.unavailable) {
      return;
    }

    const shard = client.gateway.shards.get(shardId);
    if (shard) {
      shard.guilds.set(guild.id, {
        name: guild.name,
        memberCount: guild.member_count ?? 0,
      });
    }
  }
};
