import { Client, MessageFlags, SeparatorSpacingSize } from "discord.js";
import { TextDisplay, Separator } from "../../utils/component.ts";
import { getEmoji } from "../../utils/emojis.ts";
import { isDeveloper } from "../../utils/utils.ts";

export default {
  category: "core",
  data: {
    options: [],
    name: 'reload',
    description: 'Reload the bot',
    type: 1
  },
  async execute(interaction: any, client: Client) {
    await interaction.deferReply();
    
    if (isDeveloper(interaction.user.id)) {
      const text = new TextDisplay({
        content: `${getEmoji("clock")} Reloading bot...`,
      });
      const sep = new Separator({
        spacing: SeparatorSpacingSize.Large,
        divider: true,
      });
    
      await interaction.editReply({ components: [text, sep], flags: MessageFlags.IsComponentsV2 });
    } else {
      const text = new TextDisplay({
        content: `${getEmoji("wrong")} You do not have permissions to do this.`,
      });
      const sep = new Separator({
        spacing: SeparatorSpacingSize.Large,
        divider: true,
      });
    
      await interaction.editReply({ components: [text, sep], flags: MessageFlags.IsComponentsV2 });
    }
  }
};
