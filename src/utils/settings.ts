import { QuickDB } from "quick.db";

export type SettingType = 'bool' | 'number' | 'string' | 'object' | 'array';

export interface SettingDefinition {
  key: string;
  type: SettingType;
  defaultValue: any;
  name?: string;
  description?: string;
  min?: number;
  max?: number;
  enum?: any[];
}

export class Settings {
  private static readonly SETTINGS_DEFINITIONS: SettingDefinition[] = [
    {
      key: 'ephemeral_apps',
      type: 'bool',
      defaultValue: false,
      name: "Ephemeral Apps Commands",
      description: 'Show application commands messages as ephemeral (only context commands)'
    },
    {
      key: 'ephemeral_commands',
      type: 'bool',
      defaultValue: false,
      name: "Ephemeral Commands",
      description: 'Show commands as ephemeral (this applies to all commands)'
    },
    {
      key: 'ai_system_prompt',
      type: 'string',
      min: 0,
      max: 300,
      defaultValue: "",
      name: "AI System Prompt",
      description: 'System prompt to use on AI command'
    }
  ];

  public static async get<T = any>(
    client: QuickDB,
    userId: string | null,
    settingKey: string,
    ...path: string[]
  ): Promise<T> {
    const definition = this.SETTINGS_DEFINITIONS.find(s => s.key === settingKey);
    if (!definition) {
      throw new Error(`Setting '${settingKey}' not found`);
    }

    const baseKey = userId ? `user_settings.${userId}.${settingKey}` : `global_settings.${settingKey}`;
    const fullKey = path.length > 0 ? `${baseKey}.${path.join('.')}` : baseKey;

    let value = await client.get(fullKey);

    if (value === undefined || value === null) {
      if (path.length > 0) {
        return definition.defaultValue;
      }
      value = definition.defaultValue;
      await this.put(client, userId, settingKey, value);
    }

    if (path.length === 0 && this.validateValue(value, definition) === false) {
      console.warn(`Setting '${settingKey}' has invalid value, reverting to default`);
      return definition.defaultValue;
    }

    return value as T;
  }

  public static async put(
    client: QuickDB,
    userId: string | null,
    settingKey: string,
    value: any,
    ...path: string[]
  ): Promise<void> {
    const definition = this.SETTINGS_DEFINITIONS.find(s => s.key === settingKey);
    if (!definition) {
      throw new Error(`Setting '${settingKey}' not found`);
    }

    if (path.length === 0 && this.validateValue(value, definition) === false) {
      throw new Error(`Invalid value for setting '${settingKey}'`);
    }

    const baseKey = userId ? `user_settings.${userId}.${settingKey}` : `global_settings.${settingKey}`;
    const fullKey = path.length > 0 ? `${baseKey}.${path.join('.')}` : baseKey;

    await client.set(fullKey, value);
  }

  private static validateValue(value: any, definition: SettingDefinition): boolean {
    switch (definition.type) {
      case 'bool':
        if (typeof value !== 'boolean') return false;
          break;
      case 'number':
        if (typeof value !== 'number') return false;
        if (definition.min !== undefined && value < definition.min) return false;
        if (definition.max !== undefined && value > definition.max) return false;
          break;
      case 'string':
        if (typeof value !== 'string') return false;
        if (definition.min !== undefined && value.length < definition.min) return false;
        if (definition.max !== undefined && value.length > definition.max) return false;
        if (definition.enum && !definition.enum.includes(value)) return false;
          break;
      case 'object':
        if (typeof value !== 'object' || value === null || Array.isArray(value)) return false;
          break;
      case 'array':
        if (!Array.isArray(value)) return false;
          break;
    }
    return true;
  }

  public static async getAllForUser(client: QuickDB, userId: string): Promise<Record<string, any>> {
    const result: Record<string, any> = {};
    for (const definition of this.SETTINGS_DEFINITIONS) {
      result[definition.key] = await this.get(client, userId, definition.key);
    }
    return result;
  }

  public static async resetAllForUser(client: QuickDB, userId: string): Promise<void> {
    for (const definition of this.SETTINGS_DEFINITIONS) {
      await this.put(client, userId, definition.key, definition.defaultValue);
    }
  }
}
