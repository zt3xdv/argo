import { Client, Events } from "discord.js";

export default {
  name: "ready",
  eventName: Events.ClientReady,
  once: true,
  
  async execute(readyClient: any) {
    console.log(`Ready! Logged in as ${readyClient.user.tag}`);
  }
};
