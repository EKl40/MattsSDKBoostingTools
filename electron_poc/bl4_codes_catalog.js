"use strict";

const crypto = require("crypto");
const fs = require("fs/promises");
const path = require("path");

const RESOURCE_FILES = {
  lootlemon: "MattsSDKBoostingTools_lootlemon_codes.json",
  custom: "custom_bl4_codes.json",
  gzo: "MattsSDKBoostingTools_gzo_codes.json"
};

const DEFAULT_RESOURCE_DIR = path.resolve(__dirname, "..", "external_app", "v22_parts_codes_fixed", "resources");

function text(value) {
  return String(value ?? "").trim();
}

function compactKey(value) {
  return text(value).toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "");
}

function unique(values) {
  const seen = new Set();
  const out = [];
  for (const value of values) {
    const label = text(value);
    if (!label) continue;
    const key = label.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(label);
  }
  return out.sort((a, b) => a.localeCompare(b));
}

function toArray(value) {
  if (Array.isArray(value)) {
    return value.map(text).filter(Boolean);
  }
  const raw = text(value);
  if (!raw) return [];
  return raw.split(/[;,|]/g).map(text).filter(Boolean);
}

function validSerial(value) {
  return /^@U[!-~]+$/.test(text(value));
}

function stableId(prefix, raw, serial) {
  const rawId = text(raw.id || raw.uuid || raw.key);
  if (rawId) return `${prefix}:${compactKey(rawId) || crypto.createHash("sha1").update(rawId).digest("hex").slice(0, 16)}`;
  return `${prefix}:${crypto.createHash("sha1").update(`${prefix}|${serial}`).digest("hex").slice(0, 16)}`;
}

function normalizeTitle(value, fallback = "") {
  const raw = text(value);
  return raw || fallback;
}

function normalizeType(raw) {
  const value = normalizeTitle(raw);
  const key = compactKey(value);
  const map = {
    class_mod: "Class Mods",
    class_mods: "Class Mods",
    classmod: "Class Mods",
    classmods: "Class Mods",
    assault_rifle: "Assault Rifle",
    assault_rifles: "Assault Rifle",
    ar: "Assault Rifle",
    smg: "SMG",
    sniper: "Sniper Rifle",
    sniper_rifle: "Sniper Rifle",
    sniper_rifles: "Sniper Rifle",
    shotgun: "Shotgun",
    shotguns: "Shotgun",
    pistol: "Pistol",
    pistols: "Pistol",
    grenade: "Grenade",
    grenades: "Grenade",
    ordnance: "Ordnance",
    shield: "Shield",
    shields: "Shield",
    repkit: "Repkit",
    repkits: "Repkit",
    enhancement: "Enhancement",
    enhancements: "Enhancement",
    firmware: "Firmware",
    firmwares: "Firmware"
  };
  return map[key] || value;
}

function normalizeRarity(raw) {
  const value = normalizeTitle(raw);
  const key = compactKey(value);
  const map = {
    legendary: "Legendary",
    pearl: "Pearlescent",
    pearlescent: "Pearlescent",
    epic: "Epic",
    rare: "Rare",
    uncommon: "Uncommon",
    common: "Common"
  };
  return map[key] || value;
}

function normalizeListing(raw, fallback) {
  const value = normalizeTitle(raw, fallback);
  const key = compactKey(value);
  if (key === "custom_static") return "Custom Static";
  if (key === "lootlemon") return "Lootlemon";
  if (key === "gzo") return "GZO";
  if (key === "modded") return "Modded";
  return value;
}

function normalizeMattmab(raw) {
  const value = normalizeTitle(raw);
  const key = compactKey(value);
  if (!key) return "UNCHECKED";
  if (["pass", "passed", "legit", "valid"].includes(key)) return "PASS";
  if (["fail", "failed", "modded", "invalid"].includes(key)) return "FAIL";
  if (["error", "parse_error", "exception"].includes(key)) return "ERROR";
  if (["unchecked", "not_checked", "unknown"].includes(key)) return "UNCHECKED";
  return value.toUpperCase();
}

function normalizeClassification(raw, tags) {
  const value = normalizeTitle(raw);
  const key = compactKey(value);
  if (key === "modded") return "Modded";
  if (key === "legit") return "Legit";
  if (tags.some((tag) => compactKey(tag) === "modded")) return "Modded";
  return value;
}

function decodedIdentity(raw) {
  const value = raw.decoded_identity;
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return { ...value };
  }
  return {};
}

function normalizeCodeEntry(raw, defaults) {
  if (!raw || typeof raw !== "object") return null;
  const serial = text(raw.serial || raw.code || raw.base85);
  if (!validSerial(serial)) return null;
  const tags = unique([
    ...toArray(raw.tags),
    ...toArray(raw.extra_tags),
    defaults.tag,
    raw.creator,
    raw.source,
    raw.listing
  ]);
  const source = normalizeTitle(raw.source, defaults.source);
  const listing = normalizeListing(raw.listing || raw.listing_name || raw.source, defaults.listing || source);
  const type = normalizeType(raw.type || raw.category || raw.item_type || raw.gear_type || raw.decoded_type);
  const manufacturer = normalizeTitle(raw.manufacturer || raw.mfr || raw.manu);
  const rarity = normalizeRarity(raw.rarity || raw.quality);
  const classification = normalizeClassification(raw.classification || raw.validation || raw.mattmab_classification, tags);
  const mattmab = normalizeMattmab(raw.mattmab_validator || raw.mattmab_result || raw.mattmab || raw.validation_result);
  const identity = decodedIdentity(raw);

  return {
    id: stableId(defaults.prefix, raw, serial),
    name: normalizeTitle(raw.name || raw.title || raw.label, "Unnamed Code"),
    serial,
    source,
    listing,
    type,
    manufacturer,
    rarity,
    creator: normalizeTitle(raw.creator || raw.author),
    classification,
    mattmab_validator: mattmab,
    mattmab_validator_detail: text(raw.mattmab_validator_detail || raw.mattmab_detail || raw.validation_detail),
    url: text(raw.url || raw.lootlemon_url || raw.link),
    tags,
    notes: text(raw.notes || raw.description || raw.comment),
    decoded_identity: identity,
    raw_id: text(raw.id || raw.uuid || raw.key),
    source_file: defaults.file
  };
}

async function readJsonOptional(resourceDir, file, warnings, options = {}) {
  const fullPath = path.join(resourceDir, file);
  try {
    const raw = await fs.readFile(fullPath, "utf8");
    return JSON.parse(raw);
  } catch (error) {
    if (error && error.code === "ENOENT") {
      if (!options.optional) warnings.push(`${file} is not bundled.`);
      return null;
    }
    warnings.push(`${file} could not be read: ${error.message}`);
    return null;
  }
}

function entriesFromJson(json) {
  if (Array.isArray(json)) return json;
  if (json && Array.isArray(json.entries)) return json.entries;
  if (json && Array.isArray(json.codes)) return json.codes;
  if (json && typeof json === "object") {
    return Object.values(json).filter((value) => value && typeof value === "object" && !Array.isArray(value));
  }
  return [];
}

function mergeBySerial(rows) {
  const bySerial = new Map();
  for (const row of rows) {
    const key = row.serial.toLowerCase();
    const existing = bySerial.get(key);
    if (!existing) {
      bySerial.set(key, row);
      continue;
    }
    bySerial.set(key, {
      ...existing,
      ...Object.fromEntries(Object.entries(row).filter(([, value]) => {
        if (Array.isArray(value)) return value.length > 0;
        if (value && typeof value === "object") return Object.keys(value).length > 0;
        return text(value);
      })),
      tags: unique([...(existing.tags || []), ...(row.tags || [])])
    });
  }
  return Array.from(bySerial.values()).sort((a, b) => a.name.localeCompare(b.name));
}

function filterValues(entries) {
  return {
    listings: unique(entries.flatMap((entry) => [entry.listing, entry.classification])),
    types: unique(entries.map((entry) => entry.type)),
    manufacturers: unique(entries.map((entry) => entry.manufacturer)),
    rarities: unique(entries.map((entry) => entry.rarity)),
    creators: unique(entries.map((entry) => entry.creator)),
    mattmabResults: ["All", "Legit", "Modded", "Error", "Unchecked"]
  };
}

async function loadBl4Catalog(resourceDir = DEFAULT_RESOURCE_DIR) {
  const warnings = [];
  const sources = [
    {
      key: "lootlemon",
      defaults: {
        prefix: "lootlemon",
        source: "Lootlemon",
        listing: "Lootlemon",
        tag: "lootlemon",
        file: RESOURCE_FILES.lootlemon
      }
    },
    {
      key: "gzo",
      defaults: {
        prefix: "gzo",
        source: "GZO",
        listing: "GZO",
        tag: "gzo",
        file: RESOURCE_FILES.gzo,
        optional: true
      }
    },
    {
      key: "custom",
      defaults: {
        prefix: "custom",
        source: "Custom Static",
        listing: "Custom Static",
        tag: "custom",
        file: RESOURCE_FILES.custom
      }
    }
  ];

  const counts = {};
  const normalized = [];
  for (const source of sources) {
    const json = await readJsonOptional(resourceDir, source.defaults.file, warnings, { optional: Boolean(source.defaults.optional) });
    const entries = entriesFromJson(json);
    counts[source.key] = entries.length;
    for (const entry of entries) {
      const row = normalizeCodeEntry(entry, source.defaults);
      if (row) normalized.push(row);
    }
  }

  const entries = mergeBySerial(normalized);
  return {
    ok: true,
    entries,
    counts: {
      ...counts,
      merged: entries.length
    },
    filters: filterValues(entries),
    warnings
  };
}

module.exports = {
  loadBl4Catalog,
  normalizeCodeEntry,
  validSerial
};
