import { GatewayDispatchEvents } from '@discordjs/core';

export default {
  name: GatewayDispatchEvents.Ready,
  once: true,
  
  async execute({ data }, client) {
    console.log(`Logged in as ${data.user.username}.`);
  }
};
