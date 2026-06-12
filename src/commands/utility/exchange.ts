import { Client, MessageFlags, SeparatorSpacingSize, ApplicationCommandType } from "discord.js";
import { TextDisplay, Separator } from "../../utils/component.ts";
import { Container } from "../../utils/container.ts";
import { getEmoji } from "../../utils/emojis.ts";
import { makeRequest } from "../../utils/request.ts";
import { FormatCurrency } from "../../utils/utils.ts";

export default {
  category: "utility",
  data: {
    type: [ ApplicationCommandType.ChatInput ],
    options: [
      { type: 10, name: "amount", description: "Amount to exchange", required: true },
      { type: 3, name: "from", description: "Currency to convert from", required: true, autocomplete: true },
      { type: 3, name: "to", description: "Currency to convert to", required: true, autocomplete: true }
    ],
    name: "exchange",
    description: "Convert different currencies"
  },
  async autocomplete(interaction: any, client: Client) {
    const focused = interaction.options.getFocused(true);
    const query = focused.value.toLowerCase();
    const res = await makeRequest('https://api.frankfurter.dev/v2/currencies', { method: "GET", response: "JSON" });

    const choices = res
      .map((currency: any) => ({
        name: `${currency.name} - ${currency.iso_code}`,
        value: currency.iso_code,
      }))
      .filter((currency: any) => currency.name.toLowerCase().includes(query))
      .slice(0, 25);

    await interaction.respond(choices);
  },
  async execute(interaction: any, client: Client) {
    await interaction.deferReply();
    const amount = interaction.options?.getNumber("amount");
    const from = interaction.options?.getString("from");
    const to = interaction.options?.getString("to");
    
    const res = await makeRequest(`https://api.frankfurter.dev/v2/rate/${from}/${to}`, { method: "GET", response: "JSON" });
    
    await interaction.editReply({ 
      components: [
        new Container({
          components: [
            new TextDisplay({
              content: `${getEmoji("dollar")} ${FormatCurrency(amount, from)} **${from.toUpperCase()}** -> ${FormatCurrency(res.rate * amount, to)} **${to.toUpperCase()}**`
            }),
            new Separator({
              spacing: SeparatorSpacingSize.Large,
              divider: true,
            }),
            new TextDisplay({
              content: `-# **Exchange rate:** 1 **${from.toUpperCase}** -> ${FormatCurrency(res.rate, to)} **${to.toUpperCase()}**`
            })
          ] 
        })], 
      flags: MessageFlags.IsComponentsV2 
    });
  },
};
