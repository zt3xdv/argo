import { Resvg } from "@resvg/resvg-wasm";
import { ApplicationCommandOptionType, ApplicationCommandType, ApplicationIntegrationType, InteractionContextType, ComponentType, MessageFlags } from "@discordjs/core";
import database from "../../utils/database.js";
import config from "../../../config.json" with { type: "json" };
import { getEmoji, escapeXml, fetchImage } from "../../utils/utils.js";

export default {
  name: "lastfm",
  description: "See what music you are listening to on Last.fm",
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
      name: "set",
      description: "Set your Last.fm username",
      type: ApplicationCommandOptionType.Subcommand,
      options: [
        {
          name: "username",
          description: "Your Last.fm username",
          type: ApplicationCommandOptionType.String,
          required: true,
          min_length: 1,
          max_length: 64,
        },
      ],
    },
    
    // just another not checked subcomand cuz yes
    {
      name: "recent",
      description: "View what are you listening to",
      type: ApplicationCommandOptionType.Subcommand,
    },
  ],

  async execute({ data: interaction, api }, client) {
    const apiUrl = "https://ws.audioscrobbler.com/2.0/";
    const interactionUser = interaction.member?.user ?? interaction.user;
    const userId = interactionUser.id;
    const databaseKey = `lastfm.username.${userId}`;

    const options = interaction.data.options ?? [];
    const setSubcommand = options.find((option) => option.name === "set");

    if (setSubcommand) {
      const usernameOption = setSubcommand.options?.find((option) => option.name === "username");
      const username = String(usernameOption?.value ?? "").trim();

      if (!username) {
        return api.interactions.editReply(interaction.application_id, interaction.token, {
          components: [
            {
              type: ComponentType.TextDisplay,
              content: `-# ${getEmoji("exclamation", client)} You must provide your Last.fm username.`,
            },
          ],
          flags: MessageFlags.IsComponentsV2,
        });
      }

      await database.setItem(databaseKey, username);

      return api.interactions.editReply(interaction.application_id, interaction.token, {
        components: [
          {
            type: ComponentType.TextDisplay,
            content: `-# ${getEmoji("correct", client)} Your Last.fm username is now **${username}**.`,
          },
        ],
        flags: MessageFlags.IsComponentsV2,
      });
    }

    const username = await database.getItem(databaseKey);

    if (!username) {
      return api.interactions.editReply(interaction.application_id, interaction.token, {
        components: [
          {
            type: ComponentType.TextDisplay,
            content: `-# ${getEmoji("exclamation", client)} Set your Last.fm username using \`/lastfm set\`.`,
          },
        ],
        flags: MessageFlags.IsComponentsV2,
      });
    }

    const recentTracksParams = new URLSearchParams({
      method: "user.getrecenttracks",
      user: String(username),
      api_key: config.lastFmKey,
      format: "json",
      limit: "1",
      autocorrect: "0",
    });

    const userInfoParams = new URLSearchParams({
      method: "user.getinfo",
      user: String(username),
      api_key: config.lastFmKey,
      format: "json",
      autocorrect: "0",
    });

    const [recentTracksResponse, userInfoResponse] = await Promise.all([fetch(`${apiUrl}?${recentTracksParams}`), fetch(`${apiUrl}?${userInfoParams}`)]);

    if (!recentTracksResponse.ok) {
      throw new Error(`Last.fm request failed with status ${recentTracksResponse.status}`);
    }

    const data = await recentTracksResponse.json();
    const userInfoData = userInfoResponse.ok ? await userInfoResponse.json() : null;

    if (data.error) {
      return api.interactions.editReply(interaction.application_id, interaction.token, {
        components: [
          {
            type: ComponentType.TextDisplay,
            content: `-# ${getEmoji("exclamation", client)} This Last.fm user could not be found.`,
          },
        ],
        flags: MessageFlags.IsComponentsV2,
      });
    }

    const track = data.recenttracks?.track?.[0];

    if (!track) {
      return api.interactions.editReply(interaction.application_id, interaction.token, {
        components: [
          {
            type: ComponentType.TextDisplay,
            content: `-# ${getEmoji("exclamation", client)} This user has no recent tracks.`,
          },
        ],
        flags: MessageFlags.IsComponentsV2,
      });
    }

    const artist = track.artist?.["#text"] ?? "Unknown artist";
    const trackName = track.name ?? "Unknown track";
    const album = track.album?.["#text"] ?? "";

    const isPlaying = track["@attr"]?.nowplaying === "true" || track["@attr"]?.nowplaying === true;
    const image = track.image?.find((item) => item.size === "extralarge")?.["#text"] || track.image?.find((item) => item.size === "large")?.["#text"] || track.image?.at(-1)?.["#text"];
    const songUrl = track.url || `https://www.last.fm/user/${encodeURIComponent(username)}/library`;
    const status = (isPlaying ? "Listening" : "Listened") + " to";
    const scrobbles = Number(userInfoData?.user?.playcount ?? 0).toLocaleString("en-US");

    const truncate = (value, length) => value.length > length ? `${value.slice(0, length - 3)}...` : value;

    let cover;

    if (image) {
      try {
        cover = await fetchImage(image);
      } catch { /* no cover image ig */ }
    }

    const renderer = new Resvg(`
      <svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="900" height="260" viewBox="0 0 900 260">
        <defs>
          <linearGradient id="overlay" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stop-color="#000" stop-opacity=".05"/>
            <stop offset="100%" stop-color="#000" stop-opacity=".4"/>
          </linearGradient>

          <clipPath id="coverClip">
            <rect x="30" y="30" width="200" height="200" rx="18"/>
          </clipPath>
        </defs>
        
        ${cover ? `<image x="30" y="30" width="200" height="200" preserveAspectRatio="xMidYMid slice" clip-path="url(#coverClip)" href="data:${cover.mimeType};base64,${cover.base64}" xlink:href="data:${cover.mimeType};base64,${cover.base64}"/>` : `
        <rect x="30" y="30" width="200" height="200" rx="18" fill="#292929"/>`}

        <rect width="900" height="260" fill="url(#overlay)"/>

        <text x="270" y="70" fill="#b5bac1" font-family="Geist" font-size="25">
          ${escapeXml(status)}
        </text>

        <text x="270" y="125" fill="#fff" font-family="Geist" font-size="42" font-weight="700">
          ${escapeXml(truncate(trackName, 31))}
        </text>

        <text x="270" y="163" fill="#d5d8dc" font-family="Geist" font-size="27">
          ${escapeXml(truncate(artist, 34))}
        </text>

        <text x="270" y="198" fill="#aeb3ba" font-family="Geist" font-size="22">
          ${escapeXml(truncate(album || "Unknown Album", 34))}
        </text>

        <text x="270" y="232" fill="#b5bac1" font-family="Geist" font-size="20">
          ${scrobbles} scrobbles · ${escapeXml(truncate(String(username), 24))}
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
          name: "lastfm.png",
          data: png,
        },
      ],
      components: [
        {
          type: ComponentType.Container,
          components: [
            {
              type: ComponentType.MediaGallery,
              items: [
                {
                  media: {
                    url: "attachment://lastfm.png",
                  },
                },
              ],
            },
            {
              type: ComponentType.TextDisplay,
              content:
                `-# ${getEmoji("music", client)} **${status} [${trackName}](${songUrl})** by **${artist}**\n` +
                (album ? `\nAlbum: **${album}**` : "") +
                `\n-# Account: ${username} · ${scrobbles} scrobbles`,
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
