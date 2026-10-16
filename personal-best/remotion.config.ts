/**
 * Note: When using the Node.JS APIs, the config file
 * doesn't apply. Instead, pass options directly to the APIs.
 *
 * All configuration options: https://remotion.dev/docs/config
 */

import { Config } from "@remotion/cli/config";
import available from "./src/audio/available.json";
import { resolveSlot, SLOTS } from "./src/audio/manifest";

Config.setRspack(true);
Config.setVideoImageFormat("jpeg");
Config.setOverwriteOutput(true);
Config.setDefaultPremountInSeconds(2);

// Optional: render with an already-installed Chrome/Chromium instead of the
// one Remotion downloads (useful on machines that can't reach the download).
if (process.env.REMOTION_BROWSER_EXECUTABLE) {
  Config.setBrowserExecutable(process.env.REMOTION_BROWSER_EXECUTABLE);
}

// Section 9: a large warning whenever TEMP_ placeholder audio would be used.
const temp = SLOTS.map((s) => resolveSlot(s, available.files)).filter((r) => r?.temp);
if (temp.length > 0) {
  console.warn(
    [
      "",
      "########################################################",
      "###                TEMP AUDIO IN USE                 ###",
      "###  Replace every TEMP_ sound with team-made audio  ###",
      "###  before this video is used anywhere.             ###",
      "########################################################",
      ...temp.map((r) => `  - ${r?.file}`),
      "",
    ].join("\n"),
  );
}
