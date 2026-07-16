"use strict";

const path = require("path");
const { refreshGzoCatalog } = require("../electron_poc/bl4_codes_catalog");

const repoRoot = path.resolve(__dirname, "..");
const resourceDir = path.join(repoRoot, "external_app", "v22_parts_codes_fixed", "resources");
const gzoCatalogPath = path.join(resourceDir, "MattsSDKBoostingTools_gzo_codes.json");

function countImages(entries) {
  return entries.filter((entry) => entry && entry.image_url).length;
}

(async () => {
  const catalog = await refreshGzoCatalog(resourceDir, gzoCatalogPath);
  const imageCount = countImages(catalog.entries || []);
  if (!imageCount) {
    throw new Error("GZO refresh completed, but no image URLs were found in the refreshed catalog.");
  }
  console.log(`Refreshed ${catalog.refreshed} GZO code(s).`);
  console.log(`Merged catalog now has ${catalog.entries.length} code(s), including ${imageCount} GZO image URL(s).`);
  console.log(gzoCatalogPath);
})().catch((error) => {
  console.error(error && error.stack ? error.stack : String(error));
  process.exit(1);
});
