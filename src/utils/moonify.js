import { Moonify } from "@mwyeow/moonify.js";
import config from "../../config.json" with { type: "json" };

const moonify = new Moonify({
  lastfmApiKey: config.lastFmKey,
  requestTimeoutMs: 16000,
});

export default moonify;
