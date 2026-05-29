import { Client, Events } from "discord.js";

export default {
  name: "ready",
  eventName: Events.ClientReady,
  once: true,
  
  async execute(client: Client, readyClient: any) {
    console.log(`Bot ready! Logged in as ${readyClient.user.tag}`);
  }
};
