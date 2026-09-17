import { ApplicationCommandOptionType } from "@discordjs/core";

// from discord.js/src/structures/ApplicationCommand
export function transformOption(option, received) {
  const channelTypesKey = received ? 'channelTypes' : 'channel_types';
  const minValueKey = received ? 'minValue' : 'min_value';
  const maxValueKey = received ? 'maxValue' : 'max_value';
  const minLengthKey = received ? 'minLength' : 'min_length';
  const maxLengthKey = received ? 'maxLength' : 'max_length';
  const nameLocalizationsKey = received ? 'nameLocalizations' : 'name_localizations';
  const nameLocalizedKey = received ? 'nameLocalized' : 'name_localized';
  const descriptionLocalizationsKey = received ? 'descriptionLocalizations' : 'description_localizations';
  const descriptionLocalizedKey = received ? 'descriptionLocalized' : 'description_localized';
  return {
    type: option.type,
    name: option.name,
    [nameLocalizationsKey]: option.nameLocalizations ?? option.name_localizations,
    [nameLocalizedKey]: option.nameLocalized ?? option.name_localized,
    description: option.description,
    [descriptionLocalizationsKey]: option.descriptionLocalizations ?? option.description_localizations,
    [descriptionLocalizedKey]: option.descriptionLocalized ?? option.description_localized,
    required:
      option.required ??
      (option.type === ApplicationCommandOptionType.Subcommand ||
      option.type === ApplicationCommandOptionType.SubcommandGroup
        ? undefined
        : false),
    autocomplete: option.autocomplete,
    choices: option.choices?.map(choice => ({
      name: choice.name,
      [nameLocalizedKey]: choice.nameLocalized ?? choice.name_localized,
      [nameLocalizationsKey]: choice.nameLocalizations ?? choice.name_localizations,
      value: choice.value,
    })),
    options: option.options?.map(opt => transformOption(opt, received)),
    [channelTypesKey]: option.channelTypes ?? option.channel_types,
    [minValueKey]: option.minValue ?? option.min_value,
    [maxValueKey]: option.maxValue ?? option.max_value,
    [minLengthKey]: option.minLength ?? option.min_length,
    [maxLengthKey]: option.maxLength ?? option.max_length,
  };
}

// from discord.js/src/managers/ApplicationCommandManager
export function transformCommand(command) {
  return {
    name: command.name,
    name_localizations: command.nameLocalizations ?? command.name_localizations,
    description: command.description,
    nsfw: command.nsfw,
    description_localizations: command.descriptionLocalizations ?? command.description_localizations,
    type: command.type,
    options: command.options?.map(option => transformOption(option)),
   // default_member_permissions,
    dm_permission: command.dmPermission ?? command.dm_permission,
    integration_types: command.integrationTypes ?? command.integration_types,
    contexts: command.contexts,
    handler: command.handler,
  };
}
