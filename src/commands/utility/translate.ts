import { Client, MessageFlags, SeparatorSpacingSize, MessageContextMenuCommandInteraction, ComponentType, ButtonStyle, TextInputStyle, ApplicationCommandType } from "discord.js";
import { TextDisplay, Separator, Modal, TextInput, Button, ActionRow } from "../../utils/component.ts";
import { Container } from "../../utils/container.ts";
import { getEmoji } from "../../utils/emojis.ts";
import { makeRequest } from "../../utils/request.ts";

export default {
  category: "utility",
  data: {
    type: [ ApplicationCommandType.ChatInput, ApplicationCommandType.Message ],
    options: [{ type: 3, name: "text", description: "Text to translate", required: true }, { type: 3, name: "from", description: "Translate from", required: false, autocomplete: true }, { type: 3, name: "to", description: "Translate to", required: false, autocomplete: true }],
    name: "translate",
    description: "Translate a text",
    context: {
      name: "Translate",
    }
  },
  async autocomplete(interaction: any, client: Client) {
    const focused = interaction.options.getFocused(true);
    const langData = focused.name === 'from' ? client.langs.sl : client.langs.tl;
    const query = focused.value.toLowerCase();

    const choices = Object.entries(langData || {})
      .filter(([short, long]) => short.includes(query) || long.toLowerCase().includes(query))
      .map(([short, long]) => ({ name: String(long), value: short }))
      .slice(0, 5);

    await interaction.respond(choices);
  },
  async execute(interaction: any, client: Client) {
    await interaction.deferReply();
    const isContextInteraction = interaction instanceof MessageContextMenuCommandInteraction;
    
    const text = isContextInteraction ? interaction.options.getMessage("message").content.trim() : interaction.options?.getString("text").trim();
    const from = isContextInteraction || !interaction.options?.getString("from") ? "auto" : interaction.options?.getString("from");
    const to = isContextInteraction || !interaction.options?.getString("to") ? interaction.locale.split("-")[0] : interaction.options?.getString("to");
    
    try {
      if (!client.langs.sl[from]) throw new Error(`Lang **\`${from}\`** is not supported.`);
      if (!client.langs.tl[to]) throw new Error(`Lang **\`${to}\`** is not supported.`);
      
      const data = await makeRequest("https://translate.googleapis.com/translate_a/single", { method: "GET", response: "JSON", timeout: 10000, params: { client: "gtx", sl: from, tl: to, dt: "t", q: text } });
      
      const reply = await interaction.editReply({ 
        components: [
          new Container({
            components: [
              new TextDisplay({
                content: `${getEmoji("translate")} Translated from **${client.langs.sl[data[2]]}** to **${client.langs.tl[to]}**`
              }),
              new Separator({
                spacing: SeparatorSpacingSize.Large,
                divider: true,
              }),
              new TextDisplay({
                content: data[0][0][0]
              }),
              new ActionRow(
                new Button({
                  customId: "change_language",
                  text: "Change Language",
                  emoji: getEmoji("loop"),
                  color: ButtonStyle.Secondary
                })
              )
            ] 
          })], 
        flags: MessageFlags.IsComponentsV2 
      });
      
      // Should i change this smh
      const collector = reply.createMessageComponentCollector({
        componentType: ComponentType.Button,
        time: 120000
      });

      collector.on("collect", async (btnInt) => {
        if (btnInt.customId === "change_language") {
          btnInt.showModal(new Modal({
            customId: "change_language_modal",
            title: "Change Language",
            components: [
              new ActionRow(
                new TextInput({
                  customId: "change_language_new",
                  text: "New language",
                  format: TextInputStyle.Short,
                  placeholder: "es, en, ...",
                  max: 3,
                  min: 2,
                  required: true
                })
              )
            ]
          }));
          
          try {
            const modalSubmit = await btnInt.awaitModalSubmit({
              filter: (i) => i.customId === "change_language_modal" && i.user.id === btnInt.user.id,
              time: 60000
            });
            collector.resetTimer();

            const newLanguage = modalSubmit.fields.getTextInputValue("change_language_new");
            if (!client.langs.tl[newLanguage]) {
              await modalSubmit.reply({
                content: `${getEmoji("exclamation")} Lang **\`${newLanguage}\`** is not supported.`,
                ephemeral: true
              });
              return;
            }
            
            const newData = await makeRequest("https://translate.googleapis.com/translate_a/single", { method: "GET", response: "JSON", timeout: 10000, params: { client: "gtx", sl: from, tl: newLanguage, dt: "t", q: text } });

            await modalSubmit.update({ 
              components: [
                new Container({
                  components: [
                    new TextDisplay({
                      content: `${getEmoji("translate")} Translated from **${client.langs.sl[newData[2]]}** to **${client.langs.tl[newLanguage]}**`
                    }),
                    new Separator({
                      spacing: SeparatorSpacingSize.Large,
                      divider: true,
                    }),
                    new TextDisplay({
                      content: newData[0][0][0]
                    }),
                    new ActionRow(
                      new Button({
                        customId: "change_language",
                        text: "Change Language",
                        emoji: getEmoji("loop"),
                        color: ButtonStyle.Secondary
                      })
                    )
                  ] 
                })], 
              flags: MessageFlags.IsComponentsV2 
            });
          } catch (error) { /**/ }
        }
      });
    } catch (e) {
      await interaction.editReply({ 
        components: [
          new TextDisplay({
            content: `${getEmoji("exclamation")} ${e.message}`
          })
        ], 
        flags: MessageFlags.IsComponentsV2 
      });
    }
  },
};
