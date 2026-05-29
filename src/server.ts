import express from "express";
import { join } from "path";

export default function createServer(client) {
  const app = express();
  
  app.use(express.static(join(import.meta.dirname, "..", "dist", "web")));

  app.get("/api/status", (req, res) => {
    res.json({ status: "online", user: client.user.tag, ping: client.ws.ping });
  });
  
  app.get("/api/commands", (req, res) => {
    const cmds = client.commands.map(cmd => ({ name: cmd.data.name, description: cmd.data.description, category: cmd.category }));
    res.json(cmds);
  });
  
  app.get("/invite", (req, res) => {
    res.redirect(`https://discord.com/oauth2/authorize?client_id=${process.env.CLIENT_ID}&scope=bot+applications.commands+identify&permissions=277092879424&integration_type=0`);
  });
  
  app.get(/.*/, (req, res) => {
    res.sendFile(join(import.meta.dirname, "..", "dist", "web", "index.html"));
  });
  
  return app;
}
