import { Client, ApplicationCommandType, ComponentType, ButtonStyle, TextInputStyle, MessageFlags } from "discord.js";
import { TextDisplay, Separator, Modal, TextInput, Button, ActionRow, StringSelectMenu } from "../../utils/component.ts";
import { Container } from "../../utils/container.ts";
import { getEmoji } from "../../utils/emojis.ts";
import { Settings } from "../../utils/settings.ts";

export default {
  category: "core",
  data: {
    type: [ApplicationCommandType.ChatInput],
    options: [],
    name: "settings",
    description: "Manage your settings"
  },

  async execute(interaction: any, client: Client) {
    await interaction.deferReply();

    const userId = interaction.user.id;
    const settingsDefinitions = Settings['SETTINGS_DEFINITIONS'];
    const itemsPerPage = 5;
    let currentPage = 0;
    let lastReply;

    const renderPage = async () => {
      const startIndex = currentPage * itemsPerPage;
      const endIndex = startIndex + itemsPerPage;
      const currentSettings = settingsDefinitions.slice(startIndex, endIndex);
  
      const components = [
        new TextDisplay({
          content: `${getEmoji("settings")} **Settings** • page ${currentPage + 1}/${Math.ceil(settingsDefinitions.length / itemsPerPage)}`
        }),
        new Separator({ spacing: 2 })
      ];
  
      await Promise.all(currentSettings.map(async (setting) => {
        const value = await Settings.get(client.db, userId, setting.key);
        const displayValue = typeof value === 'object'
          ? JSON.stringify(value)
          : String(value);
  
        components.push(
          new TextDisplay({
            content: `### ${setting.name ? setting.name : setting.key}\n${setting.description || 'No description'}` + ((setting.type === 'string' && !setting.enum) ? `\n\n-# \`${displayValue}\`` : "")
          })
        );
  
        if (setting.type === 'bool') {
          components.push(
            new ActionRow(
              new Button({
                customId: `toggle_${setting.key}`,
                text: value ? "Enabled" : "Disabled",
                color: value ? ButtonStyle.Success : ButtonStyle.Danger
              })
            )
          );
        } 
        else if (setting.type === 'string' && setting.enum) {
          components.push(
            new ActionRow(
              new StringSelectMenu({
                customId: `enum_${setting.key}`,
                placeholder: "Change value...",
                options: setting.enum.map(option => ({
                  label: String(option),
                  value: String(option),
                  default: value === option
                }))
              })
            )
          );
        } 
        else {
          components.push(
            new ActionRow(
              new Button({
                customId: `edit_${setting.key}`,
                text: "Edit Value",
                emoji: getEmoji("edit"),
                color: ButtonStyle.Secondary
              })
            )
          );
        }
    
        components.push(new Separator({ spacing: 1 }));
      }));
    
      if (settingsDefinitions.length > itemsPerPage) {
        components.push(
          new ActionRow(
            new Button({
              customId: "prev_page",
              emoji: getEmoji("leftarrow"),
              color: ButtonStyle.Secondary,
              disabled: currentPage === 0
            }),
            new Button({
              customId: "next_page",
              emoji: getEmoji("rightarrow"),
              color: ButtonStyle.Secondary,
              disabled: endIndex >= settingsDefinitions.length
            })
          )
        );
      }
    
      return components;
    };

    const updateMessage = async () => {
      const components = await renderPage();
      lastReply = await interaction.editReply({
        components: [new Container({ components })],
        flags: MessageFlags.IsComponentsV2
      });
    };

    await updateMessage();

    const selectCollector = lastReply.createMessageComponentCollector({
      componentType: ComponentType.StringSelect,
      time: 300000,
      filter: i => i.user.id === userId
    });
      
    selectCollector.on("collect", async (menuInt) => {
      if (menuInt.customId.startsWith("enum_")) {
        const settingKey = menuInt.customId.substring(5);
        const setting = settingsDefinitions.find(s => s.key === settingKey);
      
        if (!setting) return;
      
        const newValue = menuInt.values[0];
      
        await Settings.put(client.db, userId, setting.key, newValue);
      
        await updateMessage();
        await menuInt.deferUpdate();
      }
    });

    const collector = lastReply.createMessageComponentCollector({
      componentType: ComponentType.Button,
      time: 300000,
      filter: i => i.user.id === userId
    });

    collector.on("collect", async (btnInt) => {
      if (btnInt.customId === "prev_page") {
        currentPage = Math.max(0, currentPage - 1);
        await updateMessage();
        await btnInt.deferUpdate();
      }
      else if (btnInt.customId === "next_page") {
        currentPage = Math.min(
          Math.ceil(settingsDefinitions.length / itemsPerPage) - 1,
          currentPage + 1
        );
        await updateMessage();
        await btnInt.deferUpdate();
      }
      else if (btnInt.customId.startsWith("toggle_")) {
        const settingKey = btnInt.customId.substring(7);
        const setting = settingsDefinitions.find(s => s.key === settingKey);
      
        if (!setting) return;
      
        const currentValue = await Settings.get(client.db, userId, setting.key);
        const newValue = !currentValue;
      
        await Settings.put(client.db, userId, setting.key, newValue);
      
        await updateMessage();
        await btnInt.deferUpdate();
      }
      else if (btnInt.customId.startsWith("edit_")) {
        const settingKey = btnInt.customId.substring(5);
        const setting = settingsDefinitions.find(s => s.key === settingKey);

        if (!setting) return;

        const currentValue = await Settings.get(client.db, userId, setting.key);

        let modalComponents = [];
        let modalTitle = `Edit ${setting.key}`;

        switch (setting.type) {
          case 'number':
            modalComponents.push(
              new ActionRow(
                new TextInput({
                  customId: "new_value",
                  text: "New value",
                  format: TextInputStyle.Short,
                  placeholder: String(setting.defaultValue),
                  value: String(currentValue),
                  required: true,
                  max: setting.max !== undefined ? String(setting.max).length : undefined,
                  min: setting.min !== undefined ? String(setting.min).length : undefined
                })
              )
            );
            break;

          case 'string':
            if (!setting.enum) {
              modalComponents.push(
                new ActionRow(
                  new TextInput({
                    customId: "new_value",
                    text: "New value",
                    format: TextInputStyle.Short,
                    placeholder: String(setting.defaultValue),
                    value: currentValue,
                    required: true
                  })
                )
              );
            }
            break;
        }
      }
    });
  }
};
