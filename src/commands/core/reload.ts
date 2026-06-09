import { Client, MessageFlags } from "discord.js";
import { TextDisplay } from "../../utils/component.ts";
import { getEmoji } from "../../utils/emojis.ts";
import { isDeveloper, reload } from "../../utils/utils.ts";
import git from 'isomorphic-git';
import http from 'isomorphic-git/http/node';
import fs from 'fs';
import { join } from 'path';

export default {
  category: "core",
  data: {
    options: [],
    name: 'reload',
    description: 'Reload the bot and pull from GitHub.',
    type: 1
  },
  dev: true,
  async execute(interaction: any, client: Client) {
    await interaction.deferReply();
    const dir = join(import.meta.dirname, "..", "..", "..");
    
    let text = new TextDisplay({
      content: `${getEmoji("loop")} Reloading...`,
    });
    await interaction.editReply({ components: [text], flags: MessageFlags.IsComponentsV2 });
      
    await git.checkout({ fs, dir, ref: 'HEAD', force: true });
    await git.pull({
      fs,
      http,
      dir,
      ref: 'main',
      singleBranch: true,
      fastForwardOnly: true,
      author: { name: 'Auto-Update', email: 'auto@update.local' }
    });
      
    await reload(client);
      
    const commit = await git.resolveRef({ fs, dir, ref: 'HEAD' });
    text = new TextDisplay({
      content: `${getEmoji("correct")} Bot reloaded.\n-# Commit hash: ${commit}`,
    });
    await interaction.editReply({ components: [text], flags: MessageFlags.IsComponentsV2 });
  }
};
