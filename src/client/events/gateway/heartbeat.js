import { WebSocketShardEvents } from '@discordjs/ws';

export default {
  name: WebSocketShardEvents.HeartbeatComplete,
  type: "gateway",
  once: false,
  
  async execute(payload, shardId, client) {
    const shard = client.gateway.shards.get(shardId);
    if (shard) shard.ping = payload.latency;
  }
};
