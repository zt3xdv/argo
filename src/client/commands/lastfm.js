import { Resvg } from "@resvg/resvg-wasm";
import { ApplicationCommandOptionType, ApplicationCommandType, ApplicationIntegrationType, InteractionContextType, ComponentType, MessageFlags } from "@discordjs/core";
import database from "../../utils/database.js";
import moonify from "../../utils/moonify.js";
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
    
    let tracks;
    let userInfoData;

    try {
      [tracks, userInfoData] = await Promise.all([
        moonify.getUserProfile(String(username)),
        moonify.getRecentTracks(String(username), 5)
      ]);
    } catch (e) {
      if (e.status == 404) {
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
      
      return console.error(e);
    }

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
    const status = (track.isPlaying ? "Listening" : "Listened") + " to";

    let cover;

    if (track.coverArtUrl) {
      try {
        cover = await fetchImage(track.coverArtUrl);
      } catch { /* no cover image ig */ }
    }

    let recentRows = "";

    if (subcommand === "recent") {
      const recentRowsData = await Promise.all(
        tracks.slice(0, 5).map(async (recentTrack, index) => {
          const recentIsPlaying = recentTrack.isPlaying === true;

          let recentCover;

          if (recentTrack.coverArtUrl) {
            try {
              recentCover = await fetchImage(recentTrack.coverArtUrl);
            } catch { /* no cover image ig */ }
          }

          const y = 105 + index * 125;
          const recentCoverData = recentCover ? `data:${recentCover.mimeType};base64,${recentCover.base64}` : null;

          return `
        ${recentCoverData ? `<image x="30" y="${y}" width="90" height="90" preserveAspectRatio="xMidYMid slice" href="${recentCoverData}" xlink:href="${recentCoverData}"/>` : `
        <rect x="30" y="${y}" width="90" height="90" rx="14" fill="#292929"/>`}

        <text x="145" y="${y + 30}" fill="#fff" font-family="Geist" font-size="25" font-weight="700">
          ${escapeXml(`${index + 1}. ${truncate(recentTrack.trackName ?? "Unknown track", 38)}`)}
        </text>

        <text x="145" y="${y + 60}" fill="#d5d8dc" font-family="Geist" font-size="21">
          ${escapeXml(truncate(recentTrack.artistName ?? "Unknown artist", 43))}
        </text>

        <text x="145" y="${y + 85}" fill="#aeb3ba" font-family="Geist" font-size="18">
          ${escapeXml(recentIsPlaying ? "Now playing" : truncate(recentTrack.albumName || "Unknown Album", 48))}
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

        <text x="270" y="55" fill="#b5bac1" font-family="Geist" font-size="25">
          ${escapeXml(status)}
        </text>

        <text x="270" y="110" fill="#fff" font-family="Geist" font-size="42" font-weight="700">
          ${escapeXml(truncate(track.trackName ?? "Unknown track", 31))}
        </text>

        <text x="270" y="148" fill="#d5d8dc" font-family="Geist" font-size="27">
          ${escapeXml(truncate(track.artistName ?? "Unknown artist", 34))}
        </text>

        <text x="270" y="182" fill="#aeb3ba" font-family="Geist" font-size="22">
          ${escapeXml(truncate(track.albumName || "Unknown Album", 34))}
        </text>

        <text x="270" y="217" fill="#b5bac1" font-family="Geist" font-size="20">
          ${Number(userInfoData.playCount ?? 0).toLocaleString("en-US")} scrobbles · ${escapeXml(truncate(String(username), 24))}
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
      allowed_mentions: {
        parse: [],
      },
      flags: MessageFlags.IsComponentsV2,
    });
  },
};
