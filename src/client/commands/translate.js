import { ApplicationCommandOptionType, ApplicationCommandType, ComponentType, MessageFlags } from "@discordjs/core";
import { escapeMarkdown, getOptions } from "../../utils/utils.js";
import { languages } from "../../utils/langs.js";

export default {
  name: "translate",
  description: "Translate text from one language to another",
  type: ApplicationCommandType.ChatInput,
  defer: true,
  options: [
    {
      name: "text",
      description: "The text to translate",
      type: ApplicationCommandOptionType.String,
      required: true,
      min_length: 1,
      max_length: 1500,
    },
    {
      name: "from",
      description: "The source language",
      type: ApplicationCommandOptionType.String,
      required: true,
      autocomplete: true,
    },
    {
      name: "to",
      description: "The target language",
      type: ApplicationCommandOptionType.String,
      required: true,
      autocomplete: true,
    },
  ],

  async autocomplete({ data: interaction, api }) {
    const value = String(interaction.data.options?.find((option) => option.focused)?.value ?? "").toLowerCase();

    await api.interactions.createAutocomplete(interaction.id, interaction.token, {
      choices: languages.filter(({ name, value: code }) => `${name} ${code}`.toLowerCase().includes(value)).slice(0, 25)
    });
  },

  async execute({ data: interaction, api }) {
    const { text, from, to } = getOptions(interaction);

    if (!text || !from || !to) {
      await api.interactions.editReply(interaction.application_id, interaction.token, {
        components: [
          {
            type: ComponentType.TextDisplay,
            content: `-# ${getEmoji("exclamation", client)} You must provide text, a source language, and a target language.`,
          },
        ],
        flags: MessageFlags.IsComponentsV2,
      });
      return;
    }

    const validLanguageCodes = new Set(languages.map(({ value }) => value.toLowerCase()));

    const normalizedFrom = String(from).toLowerCase();
    const normalizedTo = String(to).toLowerCase();

    if ((normalizedFrom !== "auto" && !validLanguageCodes.has(normalizedFrom)) || !validLanguageCodes.has(normalizedTo)) {
      await api.interactions.editReply(interaction.application_id, interaction.token, {
        components: [
          {
            type: ComponentType.TextDisplay,
            content: `-# ${getEmoji("exclamation", client)} The selected source or target language is invalid.`,
          },
        ],
        flags: MessageFlags.IsComponentsV2,
      });
      return;
    }

    if (normalizedFrom !== "auto" && normalizedFrom === normalizedTo) {
      await api.interactions.editReply(interaction.application_id, interaction.token, {
        components: [
          {
            type: ComponentType.TextDisplay,
            content: `-# ${getEmoji("exclamation", client)} The source and target languages must be different.`,
          },
        ],
        flags: MessageFlags.IsComponentsV2,
      });
      return;
    }

    const url = new URL("https://translate.googleapis.com/translate_a/single");

    url.search = new URLSearchParams({
      client: "gtx",
      sl: normalizedFrom,
      tl: normalizedTo,
      dt: "t",
      q: String(text),
    });

    const res = await fetch(url);

    if (!res.ok) {
      throw new Error(`Google Translate returned ${res.status}`);
    }

    const data = await res.json();
    const translatedText = data?.[0]?.map((segment) => segment?.[0]).filter(Boolean).join("");

    if (!translatedText) {
      throw new Error("No translated text returned.");
    }

    await api.interactions.editReply(interaction.application_id, interaction.token, {
      components: [
        {
          type: ComponentType.Container,
          components: [
            {
              type: ComponentType.TextDisplay,
              content:
                `-# ${getEmoji("translate", client)} from **${normalizedFrom.toUpperCase()}** to **${normalizedTo.toUpperCase()}**\n\n` +
                escapeMarkdown(translatedText),
            },
          ],
        },
      ],
      flags: MessageFlags.IsComponentsV2,
    });
  },
};
