import { TextInputBuilder } from '@discordjs/builders';
import { ActionRowBuilder, ButtonBuilder, ButtonStyle, ChannelSelectMenuBuilder, ComponentType, MentionableSelectMenuBuilder, MediaGalleryBuilder, ModalBuilder, RoleSelectMenuBuilder, SeparatorBuilder, SeparatorSpacingSize, SectionBuilder, StringSelectMenuBuilder, ThumbnailBuilder, TextDisplayBuilder, TextInputStyle, TextInputStyle as TextInputBuilderStyle, UserSelectMenuBuilder, type APISelectMenuOption, type APIMediaGalleryItem } from 'discord.js';

export interface ModalProps {
  customId: string;
  title: string;
  components?: ActionRow[];
}

export class Modal extends ModalBuilder {
  constructor(props: ModalProps) {
    super({
      customId: props.customId,
      title: props.title,
      // @ts-ignore
      components: props.components?.map((component) => component.toJSON()),
    });
  }
}

export interface TextInputProps {
  customId: string;
  text: string;
  format: TextInputStyle;
  placeholder?: string;
  max?: number;
  min?: number;
  default?: any;
  required?: boolean;
}

export class TextInput extends TextInputBuilder {
  constructor(props: TextInputProps) {
    super({
      type: ComponentType.TextInput,
      custom_id: props.customId,
      label: props.text,
      style: props.format,
      placeholder: props.placeholder,
      max_length: props.max,
      min_length: props.min,
      value: props.default,
      required: props.required,
    });
  }
}

export interface MediaGalleryProps {
  items: APIMediaGalleryItem[];
}

export class MediaGallery extends MediaGalleryBuilder {
  constructor(props: MediaGalleryProps) {
    super({
      items: props.items,
    });
  }
}

export interface SectionProps {
  components?: TextDisplay[];
  accessory?: Button | Thumbnail;
}

export class Section extends SectionBuilder {
  constructor(props: SectionProps) {
    super({
      components: props.components?.map((c) => c.toJSON()),
      accessory: props.accessory?.toJSON(),
    });
  }
}

export interface TextDisplayProps {
  content: string;
}

export class TextDisplay extends TextDisplayBuilder {
  constructor(props: TextDisplayProps) {
    super({ content: props.content });
  }
}

export interface ThumbnailProps {
  url: string;
  description?: string;
}

export class Thumbnail extends ThumbnailBuilder {
  constructor(props: ThumbnailProps) {
    super({ media: { url: props.url }, description: props.description });
  }
}

export interface SeparatorProps {
  spacing?: SeparatorSpacingSize;
  divider?: boolean;
}

export class Separator extends SeparatorBuilder {
  constructor(props: SeparatorProps) {
    super({
      spacing: props.spacing,
      divider: props.divider,
    });
  }
}

export interface ButtonProps {
  customId?: string;
  text?: string;
  emoji?: string;
  url?: string;
  color: ButtonStyle;
  disabled?: boolean;
}

export class Button extends ButtonBuilder {
  constructor(props: ButtonProps) {
    super({
      customId: props.color === ButtonStyle.Link ? undefined : props.customId,
      label: props.text,
      emoji: props.emoji as string,
      url: props.color === ButtonStyle.Link ? props.url : undefined,
      style: props.color as any,
      disabled: props.disabled,
    });
  }
}

export interface StringSelectMenuProps {
  customId: string;
  placeholder?: string;
  maxValues?: number;
  minValues?: number;
  disabled?: boolean;
  options?: APISelectMenuOption[];
}

export class StringSelectMenu extends StringSelectMenuBuilder {
  constructor(props: StringSelectMenuProps) {
    super({
      custom_id: props.customId,
      placeholder: props.placeholder,
      max_values: props.maxValues,
      min_values: props.minValues,
      options: props.options,
      disabled: props.disabled,
    });
  }
}

export type ActionRowMessageComponents = Button | StringSelectMenu | UserSelectMenu | RoleSelectMenu | MentionableSelectMenu | ChannelSelectMenu | TextInput;

export class ActionRow extends ActionRowBuilder<ActionRowMessageComponents> {
  constructor(...components: ActionRowMessageComponents[]) {
    super();
    this.addComponents(components);
  }
}
