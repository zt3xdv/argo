import { Client, MessageFlags, ApplicationCommandType } from "discord.js";
import { TextDisplay } from "../utils/component.ts";
import { Container } from "../utils/container.ts";
import { getEmoji } from "../utils/emojis.ts";

export default {
  category: "utility",
  data: {
    type: [ ApplicationCommandType.ChatInput ],
    options: [
      { type: 3, name: "timezone", description: "The timezone to check", required: true, autocomplete: true }
    ],
    name: "timezone",
    description: "View the actual time of a timezone",
  },
  async autocomplete(interaction: any, client: Client) {
    const focused = interaction.options.getFocused(true);
    const query = focused.value.toLowerCase();

    const choices = Object.values(Intl.supportedValuesOf('timeZone'))
      .map((zone) => ({
        name: zone,
        value: zone,
      }))
      .filter((zone) => zone.name.toLowerCase().includes(query))
      .slice(0, 25);

    await interaction.respond(choices);
  },
  async execute(interaction: any, client: Client) {
    await interaction.deferReply();
    const timezone = interaction.options?.getString("timezone");
    
    if (!Object.values(Intl.supportedValuesOf('timeZone')).includes(timezone)) {
      await interaction.editReply({
        components: [
          new Container({
            components: [
              new TextDisplay({
                content: `${getEmoji("exclamation")} Please enter a valid timezone`
              })
            ]
          })
        ],
        flags: MessageFlags.IsComponentsV2
      });
      
      return;
    }
    
    const time = new Date().toLocaleString('en-US', { timeZone: timezone, timeStyle: 'medium', hour12: false });

    await interaction.editReply({ 
      components: [
        new Container({
          components: [
            new TextDisplay({
              content: `${getEmoji("clock")} Actual time on **${timezone}**: ${time}`
            }),
          ] 
        })], 
      flags: MessageFlags.IsComponentsV2 
    });
  },
};
