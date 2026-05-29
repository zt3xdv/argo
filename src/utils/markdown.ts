export function Link(url: string, masked: string, tooltip: string = '', embed: boolean = false) {
  if (tooltip.length) tooltip = ` '${tooltip}'`;
  if (masked && !embed) return `[${masked}](<${url.replace(/\)/g, '\\)')}>${tooltip})`;
  if (masked && embed) return `[${masked}](${url.replace(/\)/g, '\\)')}${tooltip})`;
  return url;
}

export function LinkPill(url: string, content: any = '', tooltip: string = '') {
  if (tooltip.length) tooltip = ` '${tooltip}'`;
  if (content) return `[**\` ${content.toString().replace(/\`/g, 'ˋ')} \`**](${url.replace(/\)/g, '\\)')}${tooltip})`;
  return url;
}

export function IconLinkPill(icon: string, url: string, content: any = '', tooltip = '') {
  if (tooltip.length) tooltip = ` '${tooltip}'`;
  const emoji = Emojis[icon];
  if (!emoji) throw new Error(`Emoji "${icon}" does not exist`);
  if (content)
    return `${emoji.replace(/:[a-zA-Z0-9_]+:/, ':i:')} [**\` ${content.toString().replace(/\`/g, 'ˋ')} \`**](${url.replace(/\)/g, '\\)')}${tooltip})`;
  return url;
}

export function Timestamp(time: number, flag: string = 't') {
  return `<t:${Math.floor(time / 1000)}:${flag}>`;
}

export function Stringwrap(content = '', length: number, newlines = true) {
  if (!newlines) content = content.replace(/\n/, ' ');
  if (content.length > length) {
    let c = content.slice(0, length) + '...';
    while (c.endsWith(' ...')) c = c.slice(0, -4) + '...';
    return c;
  }
  return content;
}

export function Citation(number = 1, url: string, tooltip: string = '') {
  const Superscript = ['⁰', '¹', '²', '³', '⁴', '⁵', '⁶', '⁷', '⁸', '⁹'];
  let formatted = '';
  for (const n of number.toString().split('')) {
    formatted += Superscript[parseInt(n)];
  }
  if (url) {
    if (tooltip.length) {
      if (tooltip.endsWith(' ')) {
        tooltip = tooltip.slice(0, -1);
      }
      tooltip = ` '${tooltip.replace(/["*]/g, '')}'`;
    }
    return `[⁽${formatted}⁾](${url.replace(/\)/g, '\\)')}${tooltip})`;
  }
  return `⁽${formatted}⁾`;
}

export function Command(name: string, id: string) {
  return `</${name}:${id}>`;
}

export function Capitalize(text: string) {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

export function StatusToEmoji(status: string) {
  if (status == "away") {
    return "idle";
  } else if (status == "dnd") {
    return "busy";
  } else {
    return status;
  }
}

export function Highlight(content: any) {
  return '`' + content.toString().replace(/\`/g, 'ˋ') + '`';
}

export function Codeblock(type: string, content: any) {
  return '```' + type + '\n' + content.toString().replace(/\`/g, '`​') + '\n```';
}

export function Pill(content: any) {
  return `**\` ${content.toString().replace(/`/g, 'ˋ')} \`**`;
}

export function SmallPill(content: any) {
  return `\` ${content.toString().replace(/`/g, 'ˋ')} \``;
}
