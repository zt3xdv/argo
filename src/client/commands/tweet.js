import { Resvg } from "@resvg/resvg-wasm";
import { ApplicationCommandOptionType, ApplicationCommandType, ComponentType, MessageFlags } from "@discordjs/core";
import { getEmoji, getOptions, escapeXml, fetchImage } from "../../utils/utils.js";

export default {
  name: "tweet",
  description: "Get information about a tweet",
  type: ApplicationCommandType.ChatInput,
  defer: true,
  options: [
    {
      name: "link",
      description: "The link of the tweet",
      type: ApplicationCommandOptionType.String,
      required: true,
    },
  ],

  async execute({ data: interaction, api }, client) {
    const { link: linkOption } = getOptions(interaction);
    const link = String(linkOption ?? "").trim();

    if (!/^https?:\/\/(?:twitter\.com|x\.com)\/\w+\/status\/\d+/i.test(link)) {
      await client.api.interactions.editReply(interaction.application_id, interaction.token, {
        components: [
          {
            type: ComponentType.TextDisplay,
            content: `-# ${getEmoji("exclamation", client)} You must provide a valid tweet link.`,
          },
        ],
        flags: MessageFlags.IsComponentsV2,
      });
      return;
    }

    const tweetId = link.match(/status\/(\d+)/i)?.[1];
    const res = await fetch(`https://api.fxtwitter.com/status/${tweetId}`);
    const data = await res.json();

    if (!res.ok) {
      await client.api.interactions.editReply(interaction.application_id, interaction.token, {
        components: [
          {
            type: ComponentType.TextDisplay,
            content: `-# ${getEmoji("exclamation", client)} I can't find this tweet.`,
          },
        ],
        flags: MessageFlags.IsComponentsV2,
      });
      return;
    }

    const tweet = data.tweet;
    const author = tweet.author;
    const tweetText = String(tweet.text ?? "").trim();

    let avatar;

    if (author.avatar_url) {
      try {
        avatar = await fetchImage(author.avatar_url);
      } catch { /* no avatar image ig */ }
    }

    let tweetImage;

    if (tweet.media?.photos?.[0]?.url) {
      try {
        tweetImage = await fetchImage(tweet.media.photos[0].url);
      } catch { /* no tweet image ig */ }
    }

    const textLines = [];

    for (const paragraph of tweetText.split("\n")) {
      const words = paragraph.split(/\s+/);
      let line = "";

      for (const word of words) {
        const nextLine = line ? `${line} ${word}` : word;

        if (nextLine.length > 58) {
          if (line) {
            textLines.push(line);
          }

          line = word;
        } else {
          line = nextLine;
        }
      }

      if (line) {
        textLines.push(line);
      } else {
        textLines.push("");
      }
    }

    const imageHeight = tweetImage ? 470 : 0;
    const textHeight = Math.max(textLines.length, 1) * 37;
    const footerHeight = 70;
    const height = 170 + textHeight + (tweetImage ? 35 + imageHeight : 0) + footerHeight;

    const tweetImageData = tweetImage ? `data:${tweetImage.mimeType};base64,${tweetImage.base64}` : null;
    const avatarData = avatar ? `data:${avatar.mimeType};base64,${avatar.base64}` : null;

    const textRows = textLines.map((line, index) => `
        <text x="30" y="${175 + index * 37}" fill="#ffffff" font-family="Geist" font-size="27">
          ${escapeXml(line)}
        </text>
      `).join("");

    const renderer = new Resvg(`
      <svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="900" height="${height}" viewBox="0 0 900 ${height}">
        <defs>
          <clipPath id="avatarClip">
            <circle cx="78" cy="78" r="48"/>
          </clipPath>

          <clipPath id="tweetImageClip">
            <rect x="30" y="${175 + textHeight + 25}" width="840" height="${imageHeight}" rx="18"/>
          </clipPath>
        </defs>

        <rect width="900" height="${height}" rx="22" fill="#16181c"/>

        ${avatarData ? `<image x="30" y="30" width="96" height="96" preserveAspectRatio="xMidYMid slice" clip-path="url(#avatarClip)" href="${avatarData}" xlink:href="${avatarData}"/>` : `
        <circle cx="78" cy="78" r="48" fill="#292929"/>`}

        <text x="145" y="68" fill="#ffffff" font-family="Geist" font-size="29" font-weight="700">
          ${escapeXml(String(author.name ?? "Unknown user"))}
        </text>

        <text x="145" y="103" fill="#8b98a5" font-family="Geist" font-size="23">
          @${escapeXml(String(author.screen_name ?? "unknown"))}
        </text>

        ${textRows}

        ${tweetImageData ? `
        <image x="30" y="${175 + textHeight + 25}" width="840" height="${imageHeight}" preserveAspectRatio="xMidYMid slice" clip-path="url(#tweetImageClip)" href="${tweetImageData}" xlink:href="${tweetImageData}"/>
        ` : ""}

        <text x="30" y="${height - 42}" fill="#8b98a5" font-family="Geist" font-size="20">
          ${escapeXml(String(tweet.created_at ?? ""))}
        </text>
      </svg>
    `, {
      font: {
        fontBuffers: client.fontBuffers,
        loadSystemFonts: false,
      },
    });

    const png = renderer.render().asPng();

    return api.interactions.editReply(interaction.application_id, interaction.token, {
      files: [
        {
          name: "tweet.png",
          data: png,
        },
      ],
      components: [
        {
          type: ComponentType.MediaGallery,
          items: [
            {
              media: {
                url: "attachment://tweet.png",
              },
            },
          ],
        },
      ],
      allowed_mentions: {
        parse: [],
      },
      flags: MessageFlags.IsComponentsV2,
    });
  },
};
