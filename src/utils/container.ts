import { SeparatorBuilder, TextDisplayBuilder, ContainerBuilder, FileBuilder, ActionRowBuilder, MediaGalleryBuilder, SectionBuilder, type ContainerComponentBuilder, ButtonBuilder, StringSelectMenuBuilder, UserSelectMenuBuilder, RoleSelectMenuBuilder, MentionableSelectMenuBuilder, ChannelSelectMenuBuilder } from 'discord.js';

export interface ContainerProps {
  id?: number;
  spoiler?: boolean;
  components: ContainerComponentBuilder[];
  color?: number;
}

export type ActionRowComponent =
  | ButtonBuilder
  | StringSelectMenuBuilder
  | UserSelectMenuBuilder
  | RoleSelectMenuBuilder
  | MentionableSelectMenuBuilder
  | ChannelSelectMenuBuilder;

export class Container extends ContainerBuilder {
  constructor(props: ContainerProps) {
    super();
    if (props.id) this.setId(props.id);
    if (props.spoiler) this.setSpoiler(props.spoiler);
    if (props.color) this.setAccentColor(props.color);
    
    for (const component of props.components) {
      if (component instanceof FileBuilder) {
        this.addFileComponents(component);
      } else if (component instanceof SeparatorBuilder) {
        this.addSeparatorComponents(component);
      } else if (component instanceof ActionRowBuilder) {
        this.addActionRowComponents(component as ActionRowBuilder<ActionRowComponent>);
      } else if (component instanceof TextDisplayBuilder) {
        this.addTextDisplayComponents(component);
      } else if (component instanceof MediaGalleryBuilder) {
        this.addMediaGalleryComponents(component);
      } else if (component instanceof SectionBuilder) {
        this.addSectionComponents(component);
      }
    }
  }
}
