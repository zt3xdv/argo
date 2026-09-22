import { Resvg } from "@resvg/resvg-wasm";
import { ApplicationCommandOptionType, ApplicationCommandType, ApplicationIntegrationType, InteractionContextType, ComponentType, MessageFlags } from "@discordjs/core";
import database from "../../utils/database.js";
import config from "../../../config.json" with { type: "json" };
import { getEmoji, escapeXml, escapeMarkdown, fetchImage, truncate } from "../../utils/utils.js";

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
    
    // such useless subcommands
    {
      name: "last",
      description: "View what are you listening to",
      type: ApplicationCommandOptionType.Subcommand,
    },
    {
      name: "recent",
      description: "View your last 5 listened songs",
      type: ApplicationCommandOptionType.Subcommand,
    },
  ],

  async execute({ data: interaction, api }, client) {
    const apiUrl = "https://ws.audioscrobbler.com/2.0/";
    const interactionUser = interaction.member?.user ?? interaction.user;
    const userId = interactionUser.id;
    const databaseKey = `lastfm.username.${userId}`;

    const options = interaction.data.options ?? [];
    const subcommand = options[0]?.name;

    if (subcommand === "set") {
      const usernameOption = options[0]?.options?.find((option) => option.name === "username");
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
      limit: subcommand === "recent" ? "5" : "1",
      autocorrect: "0",
    });

    const userInfoParams = new URLSearchParams({
      method: "user.getinfo",
      user: String(username),
      api_key: config.lastFmKey,
      format: "json",
      autocorrect: "0",
    });

    const [recentTracksResponse, userInfoResponse] = await Promise.all([
      fetch(`${apiUrl}?${recentTracksParams}`),
      fetch(`${apiUrl}?${userInfoParams}`),
    ]);

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

    const tracks = Array.isArray(data.recenttracks?.track)
      ? data.recenttracks.track
      : data.recenttracks?.track
        ? [data.recenttracks.track]
        : [];

    if (!tracks.length) {
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

    const track = tracks[0];

    const artist = track.artist?.["#text"] ?? "Unknown artist";
    const trackName = track.name ?? "Unknown track";
    const album = track.album?.["#text"] ?? "";

    const isPlaying = track["@attr"]?.nowplaying === "true" || track["@attr"]?.nowplaying === true;
    const image = track.image?.find((item) => item.size === "extralarge")?.["#text"] || track.image?.find((item) => item.size === "large")?.["#text"] || track.image?.at(-1)?.["#text"];
    const songUrl = track.url || `https://www.last.fm/user/${encodeURIComponent(username)}/library`;
    const status = (isPlaying ? "Listening" : "Listened") + " to";
    const scrobbles = Number(userInfoData?.user?.playcount ?? 0).toLocaleString("en-US");

    let cover;

    if (image) {
      try {
        cover = await fetchImage(image);
      } catch { /* no cover image ig */ }
    }

    let recentRows = "";

    if (subcommand === "recent") {
      const recentRowsData = await Promise.all(
        tracks.slice(0, 5).map(async (recentTrack, index) => {
          const recentArtist = recentTrack.artist?.["#text"] ?? "Unknown artist";
          const recentTrackName = recentTrack.name ?? "Unknown track";
          const recentAlbum = recentTrack.album?.["#text"] ?? "Unknown album";
          const recentIsPlaying = recentTrack["@attr"]?.nowplaying === "true" || recentTrack["@attr"]?.nowplaying === true;
          const recentImage = recentTrack.image?.find((item) => item.size === "extralarge")?.["#text"] || recentTrack.image?.find((item) => item.size === "large")?.["#text"] || recentTrack.image?.at(-1)?.["#text"];

          let recentCover;

          if (recentImage) {
            try {
              recentCover = await fetchImage(recentImage);
            } catch { /* no cover image ig */ }
          }

          const y = 105 + index * 125;
          const recentCoverData = recentCover ? `data:${recentCover.mimeType};base64,${recentCover.base64}` : null;

          return `
        ${recentCoverData ? `<image x="30" y="${y}" width="90" height="90" preserveAspectRatio="xMidYMid slice" clip-path="url(#coverClip)" href="${recentCoverData}" xlink:href="${recentCoverData}"/>` : `
        <rect x="30" y="${y}" width="90" height="90" rx="14" fill="#292929"/>`}

        <text x="145" y="${y + 30}" fill="#fff" font-family="Geist" font-size="25" font-weight="700">
          ${escapeXml(`${index + 1}. ${truncate(recentTrackName, 38)}`)}
        </text>

        <text x="145" y="${y + 60}" fill="#d5d8dc" font-family="Geist" font-size="21">
          ${escapeXml(truncate(recentArtist, 43))}
        </text>

        <text x="145" y="${y + 85}" fill="#aeb3ba" font-family="Geist" font-size="18">
          ${escapeXml(recentIsPlaying ? "Now playing" : truncate(recentAlbum || "Unknown Album", 48))}
        </text>
      `;
        }),
      );

      recentRows = recentRowsData.join("");
    }

    const renderer = new Resvg(`
      <svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="900" height="${subcommand === "recent" ? 150 + tracks.slice(0, 5).length * 125 : 260}" viewBox="0 0 900 ${subcommand === "recent" ? 150 + tracks.slice(0, 5).length * 125 : 260}">
        <defs>
          <linearGradient id="overlay" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stop-color="#000" stop-opacity=".05"/>
            <stop offset="100%" stop-color="#000" stop-opacity=".4"/>
          </linearGradient>

          <clipPath id="coverClip">
            <rect x="30" y="30" width="200" height="200" rx="18"/>
          </clipPath>
        </defs>
        
        ${subcommand === "recent" ? `
        <text x="30" y="52" fill="#fff" font-family="Geist" font-size="31" font-weight="700">
          Recent tracks
        </text>

        <text x="30" y="80" fill="#b5bac1" font-family="Geist" font-size="19">
          ${escapeXml(String(username))}
        </text>

        ${recentRows}` : `
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
        </text>`}
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
            }
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
