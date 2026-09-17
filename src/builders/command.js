// from discord.js/src/managers/ApplicationCommandManager
export function transformCommand(command) {
  let default_member_permissions;

  if ('default_member_permissions' in command) {
    default_member_permissions = command.default_member_permissions
      ? new PermissionsBitField(BigInt(command.default_member_permissions)).bitfield.toString()
      : command.default_member_permissions;
  }
  
  if ('defaultMemberPermissions' in command) {
    default_member_permissions =
      command.defaultMemberPermissions !== null
        ? new PermissionsBitField(command.defaultMemberPermissions).bitfield.toString()
        : command.defaultMemberPermissions;
  }

  return {
    name: command.name,
    name_localizations: command.nameLocalizations ?? command.name_localizations,
    description: command.description,
    nsfw: command.nsfw,
    description_localizations: command.descriptionLocalizations ?? command.description_localizations,
    type: command.type,
    options: command.options?.map(option => ApplicationCommand.transformOption(option)),
    default_member_permissions,
    dm_permission: command.dmPermission ?? command.dm_permission,
    integration_types: command.integrationTypes ?? command.integration_types,
    contexts: command.contexts,
    handler: command.handler,
  };
}
