import express from "express";
import { join } from "path";

export default function createServer(client) {
  const app = express();
  
  app.use(express.static(join(import.meta.dirname, "..", "dist", "web")));

  app.get("/api/stats", (req, res) => {
    const guildCount = client?.guilds?.cache?.size ?? (interaction.guild ? 1 : 0);
    const totalUsers = client?.guilds?.cache?.reduce((acc, guild) => acc + guild.memberCount, 0);

    res.json({ status: "online", guildCount, totalUsers, user: client.user.tag, ping: client.ws.ping });
  });
  
  app.get("/api/commands", (req, res) => {
    const cmds = client.commands.filter(cmd => !cmd.dev).map(cmd => ({ name: cmd.data.name, description: cmd.data.description, category: cmd.category }));
    res.json(cmds);
  });
  
  app.get("/invite", (req, res) => {
    res.redirect(`https://discord.com/oauth2/authorize?client_id=${process.env.CLIENT_ID}`);
  });
  
  app.get(/.*/, (req, res) => {
    res.sendFile(join(import.meta.dirname, "..", "dist", "web", "index.html"));
  });
  
  return app;
}
