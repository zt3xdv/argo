import { GatewayDispatchEvents } from "@discordjs/core";
import { startReminderWorker } from "../../utils/handlers/vote.js";

export default {
  name: GatewayDispatchEvents.Ready,
  once: true,
  
  async execute({ data }, client) {
    console.log(`Logged in as ${data.user.username}.`);
    
    startReminderWorker(client);
  }
};
