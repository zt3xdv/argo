import { WebSocketShardEvents } from '@discordjs/ws';

export default {
  name: WebSocketShardEvents.Ready,
  type: "gateway",
  once: false,
  
  async execute(_, shardId, client) {
    client.gateway.shards.set(shardId, {
      ping: -1,
      guilds: new Map()
    });
  }
};
