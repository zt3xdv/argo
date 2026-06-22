import { Client, Events, ActivityType } from "discord.js";

export default {
  name: "ready",
  eventName: Events.ClientReady,
  once: true,
  
  async execute(client: any) {
    console.log(`Ready! Logged in as ${client.user.tag}`);
    
    client.user.setPresence({
        activities: [{
            name: 'customstatus',
            type: ActivityType.Custom,
            state: 'heh'
        }],
        status: 'idle',
    });
  }
};
