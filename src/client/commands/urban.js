import { ApplicationCommandOptionType, ApplicationCommandType, ApplicationIntegrationType, InteractionContextType, ComponentType, MessageFlags, ButtonStyle } from "@discordjs/core";
import { getEmoji, truncate, escapeMarkdown, formatDate, getOptions } from "../../utils/utils.js";

export default {
  name: "urban",
  description: "Search for a definition on Urban Dictionary",
  integrationTypes: [
    ApplicationIntegrationType.GuildInstall,
    ApplicationIntegrationType.UserInstall,
  ],
  contexts: [
    InteractionContextType.BotDM,
    InteractionContextType.Guild,
    InteractionContextType.PrivateChannel,
  ],
  type: ApplicationCommandType.ChatInput,
  defer: true,
  options: [
    {
      name: "term",
      description: "The word or phrase to search for",
      type: ApplicationCommandOptionType.String,
      required: true,
      min_length: 1,
      max_length: 64,
    },
  ],

  async execute({ data: interaction, api }, client) {
    const { term } = getOptions(interaction, {
      term: (v) => String(v ?? "").trim()
    };

    if (!term) {
      return api.interactions.editReply(interaction.application_id, interaction.token, {
        components: [
          {
            type: ComponentType.TextDisplay,
            content: `${getEmoji("exclamation", client)} You must provide a word or phrase to search for.`,
          },
        ],
        flags: MessageFlags.IsComponentsV2,
      });
    }

    let definitions;

    try {
      const response = await fetch(`https://api.urbandictionary.com/v0/define?term=${encodeURIComponent(term)}`);

      if (!response.ok) {
        throw new Error(`Urban Dictionary returned ${response.status}`);
      }

      const data = await response.json();
      definitions = Array.isArray(data.list) ? data.list : [];
    } catch (e) {
      console.error(e);

      return api.interactions.editReply(interaction.application_id, interaction.token, {
        components: [
          {
            type: ComponentType.TextDisplay,
            content: `-# ${getEmoji("exclamation", client)} Unable to fetch definitions from Urban Dictionary.`,
          },
        ],
        flags: MessageFlags.IsComponentsV2,
      });
    }

    if (!definitions.length) {
      return api.interactions.editReply(interaction.application_id, interaction.token, {
        components: [
          {
            type: ComponentType.TextDisplay,
            content: `-# ${getEmoji("exclamation", client)} No definitions were found for **${term}**.`,
          },
        ],
        flags: MessageFlags.IsComponentsV2,
      });
    }

    let page = 0;

    const getComponents = () => {
      const definition = definitions[page];
      const writtenOn = definition.written_on ? new Date(definition.written_on).toLocaleDateString("en-US") : "Unknown";

      const content = [
        `-# **${escapeMarkdown(definition.word || term)}**`,
        "",
        escapeMarkdown(truncate(definition.definition || "No definition available.", 1700)),
        "",
        `**Example**`,
        escapeMarkdown(truncate(definition.example || "No example available.", 900)),
        "",
        `-# by **${escapeMarkdown(definition.author || "Unknown")}** • ${getEmoji("upvote", client)} ${Number(definition.thumbs_up ?? 0).toLocaleString("en-US")} • ${getEmoji("downvote", client)} ${Number(definition.thumbs_down ?? 0).toLocaleString("en-US")}`,
        `-# at ${writtenOn}${definition.permalink ? ` • [View on Urban Dictionary](${definition.permalink})` : ""}`,
        "",
        `-# Definition ${page + 1}/${definitions.length}`,
      ].join("\n");

      return [
        {
          type: ComponentType.Container,
          components: [
            {
              type: ComponentType.TextDisplay,
              content,
            },
            {
              type: ComponentType.ActionRow,
              components: [
                {
                  type: ComponentType.Button,
                  style: ButtonStyle.Secondary,
                  custom_id: "urban:previous",
                  emoji: getEmoji("leftarrow", client, true),
                  disabled: page === 0,
                },
                {
                  type: ComponentType.Button,
                  style: ButtonStyle.Secondary,
                  custom_id: "urban:next",
                  emoji: getEmoji("rightarrow", client, true),
                  disabled: page === definitions.length - 1,
                },
              ],
            },
          ],
        },
      ];
    };

    const response = await api.interactions.editReply(interaction.application_id, interaction.token, {
      components: getComponents(),
      allowed_mentions: {
        parse: [],
      },
      flags: MessageFlags.IsComponentsV2,
    });

    const messageId = response.id;

    client.collector.collectButtons({
      messageId,
      userId: interaction.member?.user?.id ?? interaction.user?.id,
      time: 120_000,

      filter: button => ["urban:previous", "urban:next", "urban:close"].includes(button.data.custom_id),

      handler: async (button, buttonApi) => {
        const customId = button.data.custom_id;

        if (customId === "urban:previous" && page > 0) {
          page--;
        }

        if (customId === "urban:next" && page < definitions.length - 1) {
          page++;
        }

        await buttonApi.interactions.updateMessage(button.id, button.token, {
          components: getComponents(),
          flags: MessageFlags.IsComponentsV2,
        });
      }
    });
  },
};
