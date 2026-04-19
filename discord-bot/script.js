require("dotenv").config();
const {
  Client,
  GatewayIntentBits,
  PermissionsBitField,
  Events,
  Partials,
  ApplicationIntegrationType,
  InteractionContextType,
  MessageFlags,
  ChannelType,
} = require("discord.js");

const TOKEN = process.env.DISCORD_TOKEN;
const EMOTICONS_BASE_URL = (process.env.EMOTICONS_BASE_URL || "").replace(/\/?$/, "/");
const AUDIBLES_BASE_URL = (process.env.AUDIBLES_BASE_URL || "").replace(/\/?$/, "/");
const emoticon_PREFIX = "!";
const SLASH_COMMAND = "y";
const AUDIBLE_SLASH_COMMAND = "ya";
const WEBHOOK_NAME = process.env.WEBHOOK_NAME || "YahooBot";
const WEBHOOK_AVATAR_URL = process.env.WEBHOOK_AVATAR_URL;
const GUILD_ID = String(process.env.GUILD_ID || "").trim();
const REGISTER_GUILD_COMMANDS = String(process.env.REGISTER_GUILD_COMMANDS || "").trim();
const GIF_EXISTS_TTL_MS = Number(process.env.GIF_EXISTS_TTL_MS || 5 * 60_000);
const GIF_EXISTS_MAX_ENTRIES = Number(process.env.GIF_EXISTS_MAX_ENTRIES || 5_000);
const GIF_EXISTS_TIMEOUT_MS = Number(process.env.GIF_EXISTS_TIMEOUT_MS || 7_000);
const MAX_emoticon_EMBEDS = Number(process.env.MAX_emoticon_EMBEDS || 10);
const MAX_emoticon_TOKENS_PER_MESSAGE = Number(process.env.MAX_emoticon_TOKENS_PER_MESSAGE || 12);
const MAX_HEAD_CONCURRENCY = Number(process.env.MAX_HEAD_CONCURRENCY || 4);
const ALLOW_DM_PREFIX_COMMANDS = ["1", "true", "yes", "on"].includes(
  String(process.env.ALLOW_DM_PREFIX_COMMANDS || "").trim().toLowerCase()
);
const DEBUG_DM_PREFIX = ["1", "true", "yes", "on"].includes(
  String(process.env.DEBUG_DM_PREFIX || "").trim().toLowerCase()
);
const AUDIBLE_FOLDERS = [
  "flirt",
  "football",
  "goodbyes",
  "halloween",
  "happy-tree-friends",
  "hello",
  "insults",
  "losing",
  "madonna",
  "music",
  "siedler",
  "taunt",
  "winning",
];

if (!TOKEN) {
  throw new Error("Missing DISCORD_TOKEN in environment.");
}
if (!EMOTICONS_BASE_URL) {
  throw new Error("Missing EMOTICONS_BASE_URL in environment.");
}
if (!/^https?:\/\//i.test(EMOTICONS_BASE_URL)) {
  throw new Error("EMOTICONS_BASE_URL must be an http(s) URL.");
}
if (AUDIBLES_BASE_URL && !/^https?:\/\//i.test(AUDIBLES_BASE_URL)) {
  throw new Error("AUDIBLES_BASE_URL must be an http(s) URL (if set).");
}

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.DirectMessages,
    GatewayIntentBits.MessageContent,
  ],
  partials: [Partials.Channel, Partials.Message, Partials.User],
});

function truthyEnv(value) {
  return ["1", "true", "yes", "on"].includes(String(value || "").trim().toLowerCase());
}

const SYMBOL_TO_emoticon_NAME = {
  ":)": "happy", ":(": "sad", ";)": "winking", ":d": "big-grin", ";;)": "batting-eyelashes", ">:d<": "big-hug", ":/": "confused", ":x": "love-struck", ":\">": "blushing", ":p": "tongue", ":*": "kiss", "=((": "broken-heart", ":o": "surprise", "x(": "angry", ":>": "smug", "b)": "cool", ":s": "worried", "#:s": "whew", ">:)": "devil", ":((": "crying", ":))": "laughing", ":|": "straight-face", "/:)": "raised-eyebrows", "=))": "rolling-on-the-floor", "o:)": "angel", ":b": "nerd", "=;": "talk-to-the-hand", "i)": "sleepy", "8|": "rolling-eyes", "l)": "loser", ":&": "sick", ":$": "dont-tell-anyone", "[(": "no-talking", ":o)": "clown", "8}": "silly", "<:p": "party", "(:|": "yawn", "=p~": "drooling", ":?": "thinking", "#o": "doh", "=d>": "applause", ":ss": "nail-biting", "@)": "hypnotized", ":^o": "liar", ":w": "waiting", ":<": "sigh", ">:p": "phbbbbt", "<):)": "cowboy", ":@)": "pig", "3:o": "cow", ":(|)": "monkey", "~:>": "chicken", "@};": "rose", "%%": "good-luck", "**==": "flag", "(~~)": "pumpkin", "~o)": "coffee", "*:)": "idea", "8x": "skull", "=:)": "bug", ">)": "alien", ":l": "frustrated", "[o<": "praying", "$)": "money-eyes", ":\"": "whistling", "b(": "feeling-beat-up", ":)>": "peace-sign", "[x": "shame-on-you", "\\:d/": "dancing", ">:/": "bring-it-on", ";))": "hee-hee", "o>": "hiro", "o=>": "billy", "o+": "april", "(%)": "yin-yang", ":@": "chatterbox", "^:)^": "not-worthy", ":j": "oh-go-on", "(*)": "star", ":)]": "on-the-phone", ":c": "call-me", "~x(": "at-wits-end", ":h": "wave", ":t": "time-out", "8>": "day-dreaming", ":??": "i-dont-know", "%(": "not-listening", ":o3": "puppy-dog-eyes", "x_x": "i-dont-want-to-see", ":!!": "hurry-up", "\\m/": "rock-on", ":q": "thumbs-down", ":bd": "thumbs-up", "^#(^": "it-wasnt-me", ":bz": "bee", "~^o^~": "cheer", "@^@|||": "dizzy", "[]": "cook", "^o^||3": "eat", ":(||>": "give-up", "+_+": "cold", ":::^^:::": "hot", "o|^_^|o": "music", ":puke!": "vomit", "o|\\~": "sing", "o|:)": "catch", ":(fight)": "fight", "%*{": "down-on-luck", "%||:{": "unlucky", "&[]": "gift", ":(tv)": "tv", "?@_@?": "studying", ":>~~": "spooky", "@@": "search-me", ":(game)": "game", ":)/\\:)": "high-five", "[]==[]": "exercise", ":ar!": "pirate", "[..]": "transformer"
};
const symbolToemoticonName = new Map(Object.entries(SYMBOL_TO_emoticon_NAME));
const ALL_emoticon_NAMES = [...new Set(Object.values(SYMBOL_TO_emoticon_NAME))].sort();
const emoticonNameSet = new Set(ALL_emoticon_NAMES);
const nameToPrimarySymbol = new Map();
let audibleCatalog = [];
for (const [symbol, name] of symbolToemoticonName.entries()) {
  if (!nameToPrimarySymbol.has(name)) {
    nameToPrimarySymbol.set(name, symbol);
  }
}

const SLASH_COMMAND_DEFINITION = [
  {
    name: SLASH_COMMAND,
    description: "Send Yahoo emoticon GIF or list all emoticons",
    integration_types: [
      ApplicationIntegrationType.GuildInstall,
      ApplicationIntegrationType.UserInstall,
    ],
    contexts: [
      InteractionContextType.Guild,
      InteractionContextType.BotDM,
      InteractionContextType.PrivateChannel,
    ],
    options: [
      {
        name: "emoticon",
        description: "emoticon name, symbol, or 'all'",
        type: 3,
        required: false,
        autocomplete: true,
      },
    ],
  },
  {
    name: AUDIBLE_SLASH_COMMAND,
    description: "Send Yahoo audible audio",
    integration_types: [
      ApplicationIntegrationType.GuildInstall,
      ApplicationIntegrationType.UserInstall,
    ],
    contexts: [
      InteractionContextType.Guild,
      InteractionContextType.BotDM,
      InteractionContextType.PrivateChannel,
    ],
    options: [
      {
        name: "audible",
        description: "audible name",
        type: 3,
        required: true,
        autocomplete: true,
      },
    ],
  },
];

async function safeReply(message, content) {
  try {
    await message.reply(content);
  } catch (error) {
    console.error("Reply failed (likely missing Send Messages):", error?.code || error);
  }
}

async function safeSend(channel, payload) {
  try {
    await channel.send(payload);
  } catch (error) {
    console.error("Send failed:", error?.code || error);
  }
}

async function safeReplyChunks(message, chunks) {
  for (const chunk of chunks) {
    await safeReply(message, chunk);
  }
}

async function safeDmChunks(user, chunks) {
  try {
    for (const chunk of chunks) {
      await user.send(chunk);
    }
    return true;
  } catch (error) {
    console.error("DM failed:", error?.code || error);
    return false;
  }
}

function normalizeemoticonName(raw) {
  return String(raw || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function normalizeSymbol(raw) {
  return String(raw || "").trim().toLowerCase();
}

function matchesTokenSubstrings(haystack, normalizedQuery) {
  if (!normalizedQuery) return true;
  const h = String(haystack || "").toLowerCase();
  const tokens = normalizedQuery.split("-").filter((t) => t.length > 0);
  if (tokens.length === 0) return true;
  return tokens.every((t) => h.includes(t));
}

function audibleEntryMatchesNormalizedQuery(key, normalizedQuery) {
  if (!normalizedQuery) return true;
  const segments = normalizedQuery.split("/").filter((s) => s.length > 0);
  return segments.every((segment) => matchesTokenSubstrings(key, segment));
}

function normalizeAudibleName(raw) {
  return String(raw || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function normalizeAudibleQuery(raw) {
  return String(raw || "")
    .trim()
    .toLowerCase()
    .replace(/\\/g, "/")
    .replace(/\.mp4$/i, "")
    .split("/")
    .map((part) =>
      part
        .trim()
        .replace(/\s+/g, "-")
        .replace(/[^a-z0-9-_]/g, "")
        .replace(/-+/g, "-")
        .replace(/^-+|-+$/g, "")
    )
    .filter(Boolean)
    .join("/");
}

function parseGitHubRawBaseUrl(baseUrl) {
  const match = String(baseUrl || "").match(
    /^https:\/\/raw\.githubusercontent\.com\/([^/]+)\/([^/]+)\/([^/]+)\/(.+)\/$/i
  );
  if (!match) return null;
  const [, owner, repo, branch, repoPath] = match;
  return { owner, repo, branch, repoPath };
}

async function loadAudibleCatalog() {
  if (!AUDIBLES_BASE_URL) return [];

  const parsed = parseGitHubRawBaseUrl(AUDIBLES_BASE_URL);
  if (!parsed) {
    console.warn("AUDIBLES_BASE_URL is not a GitHub raw URL. Autocomplete will be limited.");
    return [];
  }

  const entries = [];
  const apiUrl =
    `https://api.github.com/repos/${encodeURIComponent(parsed.owner)}/${encodeURIComponent(parsed.repo)}` +
    `/git/trees/${encodeURIComponent(parsed.branch)}?recursive=1`;

  let response;
  try {
    response = await fetch(apiUrl);
  } catch (error) {
    console.error("Failed to load audible catalog:", error);
    return [];
  }

  if (!response.ok) {
    console.error("Failed audible catalog request:", response.status);
    return [];
  }

  const data = await response.json();
  const nodes = data.tree;
  if (!Array.isArray(nodes)) return [];

  const repoPathPrefix = parsed.repoPath.endsWith("/") ? parsed.repoPath : `${parsed.repoPath}/`;

  for (const node of nodes) {
    if (node?.type !== "blob" || !String(node?.path || "").toLowerCase().endsWith(".mp4")) continue;

    if (!node.path.startsWith(repoPathPrefix)) continue;
    const relativePath = node.path.slice(repoPathPrefix.length);

    const slashIndex = relativePath.indexOf("/");
    if (slashIndex <= 0) continue;
    const folder = relativePath.slice(0, slashIndex).toLowerCase();
    if (!AUDIBLE_FOLDERS.includes(folder)) continue;
    const fileName = relativePath.slice(slashIndex + 1);
    if (!fileName) continue;

    const withoutExt = fileName.replace(/\.mp4$/i, "");
    entries.push({
      folder,
      fileName,
      key: `${folder}/${withoutExt}`,
      url: `${AUDIBLES_BASE_URL}${folder}/${withoutExt}.mp4`,
    });
  }

  const deduped = [];
  const seen = new Set();
  for (const entry of entries) {
    if (seen.has(entry.key)) continue;
    seen.add(entry.key);
    deduped.push(entry);
  }
  deduped.sort((a, b) => a.key.localeCompare(b.key));
  return deduped;
}

let audibleCatalogLoadPromise = null;

function ensureAudibleCatalogLoading() {
  if (audibleCatalogLoadPromise) return audibleCatalogLoadPromise;
  audibleCatalogLoadPromise = loadAudibleCatalog()
    .then((catalog) => {
      audibleCatalog = catalog;
      return catalog;
    })
    .catch(() => [])
    .finally(() => {
      audibleCatalogLoadPromise = null;
    });
  return audibleCatalogLoadPromise;
}

function isIgnorableInteractionError(error) {
  const code = Number(error?.code);
  return code === 10062 || code === 40060;
}

async function safeInteractionCall(fn) {
  try {
    return await fn();
  } catch (error) {
    if (isIgnorableInteractionError(error)) return null;
    throw error;
  }
}

async function fetchWithTimeout(url, options, timeoutMs) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timeout);
  }
}

const gifExistsCache = new Map();
const gifExistsInFlight = new Map();
let headInFlightCount = 0;
const headWaitQueue = [];

async function withHeadLimit(fn) {
  if (headInFlightCount >= MAX_HEAD_CONCURRENCY) {
    await new Promise((resolve) => headWaitQueue.push(resolve));
  }
  headInFlightCount += 1;
  try {
    return await fn();
  } finally {
    headInFlightCount -= 1;
    const next = headWaitQueue.shift();
    if (next) next();
  }
}

function cacheGifExists(url, ok) {
  gifExistsCache.set(url, { ok, expiresAt: Date.now() + GIF_EXISTS_TTL_MS });
  if (gifExistsCache.size > GIF_EXISTS_MAX_ENTRIES) {
    const firstKey = gifExistsCache.keys().next().value;
    if (firstKey) gifExistsCache.delete(firstKey);
  }
}

async function gifExists(url) {
  const cached = gifExistsCache.get(url);
  if (cached && cached.expiresAt > Date.now()) return cached.ok;
  if (gifExistsInFlight.has(url)) return await gifExistsInFlight.get(url);

  const promise = (async () => {
    try {
      const ok = await withHeadLimit(async () => {
        const response = await fetchWithTimeout(url, { method: "HEAD" }, GIF_EXISTS_TIMEOUT_MS);
        return response.ok;
      });
      cacheGifExists(url, ok);
      return ok;
    } catch (error) {
      cacheGifExists(url, false);
      return false;
    } finally {
      gifExistsInFlight.delete(url);
    }
  })();

  gifExistsInFlight.set(url, promise);
  return await promise;
}

async function resolveAudibleUrl(rawName) {
  if (!AUDIBLES_BASE_URL) return null;
  const query = normalizeAudibleQuery(rawName);
  if (!query) return null;

  if (query.includes("/")) {
    const directUrl = `${AUDIBLES_BASE_URL}${query}.mp4`;
    const exists = await gifExists(directUrl);
    if (exists) return directUrl;
  }

  const catalogMatches = audibleCatalog.filter(
    (entry) => entry.key === query || entry.key.endsWith(`/${query}`)
  );
  if (catalogMatches.length === 1) return catalogMatches[0].url;
  if (catalogMatches.length > 1) return { ambiguous: true, matches: catalogMatches.slice(0, 10) };

  const fuzzyMatches = audibleCatalog.filter((entry) =>
    audibleEntryMatchesNormalizedQuery(entry.key, query)
  );
  if (fuzzyMatches.length === 1) return fuzzyMatches[0].url;
  if (fuzzyMatches.length > 1) return { ambiguous: true, matches: fuzzyMatches.slice(0, 10) };

  for (const folder of AUDIBLE_FOLDERS) {
    const audioUrl = `${AUDIBLES_BASE_URL}${folder}/${query}.mp4`;
    const exists = await gifExists(audioUrl);
    if (exists) return audioUrl;
  }
  return null;
}

function extractemoticonRequestsFromMessage(content) {
  const matches = [...content.matchAll(/!(\S*)/g)];
  const requests = [];

  for (const match of matches) {
    const rawToken = (match[1] || "").trim();
    if (rawToken.startsWith("<:") || rawToken.startsWith("<a:")) continue;
    requests.push({ full: match[0], token: rawToken });
  }

  return requests;
}

function resolveemoticonName(token) {
  const cleanedToken = String(token || "").replace(/^!+/, "");
  const normalizedSymbol = normalizeSymbol(cleanedToken);
  const bySymbol = symbolToemoticonName.get(normalizedSymbol);
  if (bySymbol) return bySymbol;

  const normalizedByName = normalizeemoticonName(cleanedToken);
  if (emoticonNameSet.has(normalizedByName)) return normalizedByName;

  const flexMatches = ALL_emoticon_NAMES.filter((name) => matchesTokenSubstrings(name, normalizedByName));
  if (flexMatches.length === 1) return flexMatches[0];
  return null;
}

function buildSuggestionText(token, maxItems = 12) {
  const normalizedName = normalizeemoticonName(token);
  const normalizedSymbol = normalizeSymbol(token);

  const rankedNames = ALL_emoticon_NAMES.filter(
    (name) => !normalizedName || matchesTokenSubstrings(name, normalizedName)
  );
  rankedNames.sort((a, b) => {
    if (!normalizedName) return a.localeCompare(b);
    const ra = emoticonNameMatchRank(a, normalizedName);
    const rb = emoticonNameMatchRank(b, normalizedName);
    for (let i = 0; i < Math.max(ra.length, rb.length); i += 1) {
      const da = ra[i] ?? 0;
      const db = rb[i] ?? 0;
      if (da !== db) return da - db;
    }
    return a.localeCompare(b);
  });
  const nameSuggestions = rankedNames.slice(0, maxItems).map((name) => `!${name}`);

  const remaining = Math.max(0, maxItems - nameSuggestions.length);
  const symbolSuggestions = [...symbolToemoticonName.entries()]
    .filter(([symbol]) => !normalizedSymbol || symbol.includes(normalizedSymbol))
    .slice(0, remaining)
    .map(([symbol, name]) => `!${symbol} -> ${name}`);

  return [...nameSuggestions, ...symbolSuggestions].join(", ");
}

function emoticonNameMatchRank(name, normalizedName) {
  if (!normalizedName) return [0];
  if (name === normalizedName) return [0, 0];
  if (name.startsWith(normalizedName)) return [1, name.length];
  const idx = name.indexOf(normalizedName);
  if (idx >= 0) return [2, idx, name.length];
  if (matchesTokenSubstrings(name, normalizedName)) return [3, name.length];
  return [99];
}

function buildAutocompleteChoices(token) {
  const normalizedName = normalizeemoticonName(token);
  const normalizedSymbol = normalizeSymbol(String(token || "").replace(/^!+/, ""));
  const choices = [];

  const nameMatches = ALL_emoticon_NAMES.filter(
    (name) => !normalizedName || matchesTokenSubstrings(name, normalizedName)
  );
  nameMatches.sort((a, b) => {
    if (!normalizedName) return a.localeCompare(b);
    const ra = emoticonNameMatchRank(a, normalizedName);
    const rb = emoticonNameMatchRank(b, normalizedName);
    for (let i = 0; i < Math.max(ra.length, rb.length); i += 1) {
      const da = ra[i] ?? 0;
      const db = rb[i] ?? 0;
      if (da !== db) return da - db;
    }
    return a.localeCompare(b);
  });

  for (const name of nameMatches) {
    const symbol = nameToPrimarySymbol.get(name);
    choices.push({
      name: symbol ? `${name} ${symbol}` : name,
      value: name,
    });
    if (choices.length >= 25) return choices;
  }

  const symbolMatches = [...symbolToemoticonName.entries()].filter(
    ([symbol]) => normalizedSymbol && symbol.includes(normalizedSymbol)
  );
  symbolMatches.sort(([sa], [sb]) => sa.length - sb.length || sa.localeCompare(sb));

  for (const [symbol, name] of symbolMatches) {
    choices.push({
      name: `${symbol} -> ${name}`.slice(0, 100),
      value: symbol.slice(0, 100),
    });
    if (choices.length >= 25) return choices;
  }

  return choices;
}

function audibleChoiceSortKey(entry, normalizedQuery) {
  if (!normalizedQuery) return [0, entry.key];
  const k = entry.key;
  if (k.startsWith(normalizedQuery)) return [0, k];
  if (k.endsWith(`/${normalizedQuery}`)) return [1, k];
  if (k.includes(normalizedQuery)) return [2, k.indexOf(normalizedQuery), k];
  return [3, k];
}

function buildAudibleAutocompleteChoices(token) {
  const normalizedQuery = normalizeAudibleQuery(token);
  const matched = audibleCatalog.filter((entry) =>
    audibleEntryMatchesNormalizedQuery(entry.key, normalizedQuery)
  );
  matched.sort((a, b) => {
    if (!normalizedQuery) return a.key.localeCompare(b.key);
    const ka = audibleChoiceSortKey(a, normalizedQuery);
    const kb = audibleChoiceSortKey(b, normalizedQuery);
    for (let i = 0; i < Math.max(ka.length, kb.length); i += 1) {
      const da = ka[i] ?? "";
      const db = kb[i] ?? "";
      if (da !== db) return da < db ? -1 : da > db ? 1 : 0;
    }
    return a.key.localeCompare(b.key);
  });

  return matched.slice(0, 25).map((entry) => ({
    name: `${entry.key}.mp4`.slice(0, 100),
    value: entry.key.slice(0, 100),
  }));
}

function buildAudibleListChunks() {
  const lines = audibleCatalog.map((entry) => `- ${entry.key}`);
  const chunks = [];
  let current = "Available Yahoo audibles:\n";
  for (const line of lines) {
    if (current.length + line.length + 1 > 1900) {
      chunks.push(current);
      current = "";
    }
    current += `${line}\n`;
  }
  if (current.trim()) chunks.push(current);
  return chunks;
}

function buildemoticonListChunks() {
  const lines = ALL_emoticon_NAMES.map((name) => {
    const symbol = nameToPrimarySymbol.get(name) || "-";
    return `- ${name} (${symbol})`;
  });

  const chunks = [];
  let current = "Available Yahoo emoticons:\n";
  for (const line of lines) {
    if (current.length + line.length + 1 > 1900) {
      chunks.push(current);
      current = "";
    }
    current += `${line}\n`;
  }
  if (current.trim()) chunks.push(current);
  return chunks;
}

async function getOrCreateWebhook(channel) {
  const webhooks = await channel.fetchWebhooks();
  let webhook = webhooks.find((wh) => wh.name === WEBHOOK_NAME);

  if (!webhook) {
    webhook = await channel.createWebhook({
      name: WEBHOOK_NAME,
      avatar: WEBHOOK_AVATAR_URL,
    });
  }

  return webhook;
}

async function registerSlashCommands() {
  if (GUILD_ID) {
    try {
      const guild = await client.guilds.fetch(GUILD_ID);
      await guild.commands.set(SLASH_COMMAND_DEFINITION);
      console.log(`Registered /${SLASH_COMMAND} and /${AUDIBLE_SLASH_COMMAND} in guild: ${guild.name}`);
      return;
    } catch (error) {
      console.error(`Failed guild registration in GUILD_ID=${GUILD_ID}:`, error);
    }
  }

  if (REGISTER_GUILD_COMMANDS && truthyEnv(REGISTER_GUILD_COMMANDS)) {
    console.warn(
      "REGISTER_GUILD_COMMANDS is set, but per-guild registration is intentionally disabled to avoid rate limits. " +
      "Set GUILD_ID to register quickly in a single guild, otherwise global registration will be used."
    );
  }

  try {
    await client.application.commands.set(SLASH_COMMAND_DEFINITION);
    console.log(`Registered global /${SLASH_COMMAND} and /${AUDIBLE_SLASH_COMMAND} commands.`);
  } catch (error) {
    console.error("Failed global slash command registration:", error);
  }
}

client.once(Events.ClientReady, async () => {
  console.log(`Bot online as ${client.user.tag}`);
  audibleCatalog = await loadAudibleCatalog();
  console.log(`Loaded ${symbolToemoticonName.size} emoticon mappings.`);
  console.log(`Loaded ${audibleCatalog.length} audible files.`);
  await registerSlashCommands();
  console.log(`Registered slash commands.`);
  console.log(`Command format: ${emoticon_PREFIX}gif-name`);
});

client.on("interactionCreate", async (interaction) => {
  try {
    if (interaction.isAutocomplete()) {
      if (interaction.commandName === AUDIBLE_SLASH_COMMAND) {
        if (audibleCatalog.length === 0) ensureAudibleCatalogLoading();
        const focused = interaction.options.getFocused();
        const choices = buildAudibleAutocompleteChoices(focused);
        await safeInteractionCall(() => interaction.respond(choices));
        return;
      }

      if (interaction.commandName !== SLASH_COMMAND) return;
      const focused = interaction.options.getFocused();
      const choices = buildAutocompleteChoices(focused);
      await safeInteractionCall(() => interaction.respond(choices));
      return;
    }

    if (!interaction.isChatInputCommand()) return;

    if (interaction.commandName === AUDIBLE_SLASH_COMMAND) {
      const rawAudible = interaction.options.getString("audible") || "";
      const normalizedAudible = String(rawAudible).trim().toLowerCase();

      if (normalizedAudible === "all") {
        await safeInteractionCall(() => interaction.deferReply({ flags: MessageFlags.Ephemeral }));
        if (!interaction.deferred && !interaction.replied) return;
        if (audibleCatalog.length === 0) await ensureAudibleCatalogLoading();
        if (audibleCatalog.length === 0) {
          await safeInteractionCall(() =>
            interaction.editReply({
              content: "No audible catalog is available. Check `AUDIBLES_BASE_URL`.",
            })
          );
          return;
        }

        const chunks = buildAudibleListChunks();
        await safeInteractionCall(() => interaction.editReply({ content: chunks[0] }));
        for (let i = 1; i < chunks.length; i += 1) {
          await safeInteractionCall(() =>
            interaction.followUp({ content: chunks[i], flags: MessageFlags.Ephemeral })
          );
        }
        return;
      }

      await safeInteractionCall(() => interaction.deferReply());
      if (!interaction.deferred && !interaction.replied) return;

      if (!AUDIBLES_BASE_URL) {
        await safeInteractionCall(() =>
          interaction.editReply({
            content: "Missing AUDIBLES_BASE_URL in environment.",
          })
        );
        return;
      }

      const audioUrl = await resolveAudibleUrl(rawAudible);
      if (!audioUrl) {
        await safeInteractionCall(() =>
          interaction.editReply({
            content: `I could not find \`${normalizeAudibleQuery(rawAudible) || rawAudible}\` at the audible base URL.`,
          })
        );
        return;
      }
      if (audioUrl.ambiguous) {
        const options = audioUrl.matches.map((entry) => `\`${entry.key}\``).join(", ");
        await safeInteractionCall(() =>
          interaction.editReply({
            content: `That audible name matches multiple files. Try one of: ${options}`,
          })
        );
        return;
      }

      const audibleFileName = `${audioUrl.split("/").pop() || "audible.mp4"}`;
      await safeInteractionCall(() =>
        interaction.editReply({
          files: [{ attachment: audioUrl, name: audibleFileName }],
        })
      );
      return;
    }

    if (interaction.commandName !== SLASH_COMMAND) return;

    const rawToken = interaction.options.getString("emoticon") || "";
    const normalizedToken = String(rawToken).trim();

    if (!normalizedToken || normalizedToken.toLowerCase() === "all") {
      await safeInteractionCall(() =>
        interaction.deferReply({ flags: MessageFlags.Ephemeral })
      );
      if (!interaction.deferred && !interaction.replied) return;
      const chunks = buildemoticonListChunks();
      await safeInteractionCall(() => interaction.editReply({ content: chunks[0] }));
      for (let i = 1; i < chunks.length; i += 1) {
        await safeInteractionCall(() =>
          interaction.followUp({ content: chunks[i], flags: MessageFlags.Ephemeral })
        );
      }
      return;
    }

    await safeInteractionCall(() => interaction.deferReply());
    if (!interaction.deferred && !interaction.replied) return;

    const resolvedName = resolveemoticonName(normalizedToken);
    if (!resolvedName) {
      const suggestions = buildSuggestionText(normalizedToken, 20);
      await safeInteractionCall(() =>
        interaction.editReply({
          content: suggestions
            ? `I could not find \`${normalizedToken}\` at the GIF base URL. Suggestions: ${suggestions}`
            : `I could not find \`${normalizedToken}\` at the GIF base URL.`,
        })
      );
      return;
    }

    const gifUrl = `${EMOTICONS_BASE_URL}${resolvedName}.gif`;
    const exists = await gifExists(gifUrl);
    if (!exists) {
      await safeInteractionCall(() =>
        interaction.editReply({
          content: `I could not find \`${resolvedName}.gif\` at the GIF base URL.`,
        })
      );
      return;
    }

    await safeInteractionCall(() =>
      interaction.editReply({
        embeds: [{ image: { url: gifUrl } }],
      })
    );
  } catch (error) {
    if (isIgnorableInteractionError(error)) return;
    console.error("Slash command error:", error);
    if (interaction.isRepliable()) {
      if (interaction.deferred || interaction.replied) {
        await interaction.editReply({ content: "Could not process command." }).catch(() => null);
      } else {
        await interaction.reply({ content: "Could not process command." }).catch(() => null);
      }
    }
  }
});

client.on("messageCreate", async (message) => {
  try {
    if (message.partial) {
      try {
        message = await message.fetch();
      } catch (error) {
        console.error("Failed to fetch partial message:", error?.code || error);
        return;
      }
    }
    if (message.author.bot) return;
    if (!message.channel) return;
    if (!message.guild && !ALLOW_DM_PREFIX_COMMANDS) return;

    if (message.channel.partial) {
      try {
        await message.channel.fetch();
      } catch (error) {
        console.error("Failed to fetch partial channel:", error?.code || error);
        return;
      }
    }

    const content = String(message.content || "").trim();
    if (DEBUG_DM_PREFIX && !message.guild) {
      console.log(
        `[DM prefix] from=${message.author?.tag || message.author?.id} ` +
        `channelType=${message.channel?.type}(${Object.entries(ChannelType).find(([, v]) => v === message.channel?.type)?.[0] || "unknown"}) ` +
        `contentLen=${content.length} content=${JSON.stringify(content.slice(0, 80))}`
      );
    }
    if (!content.includes(emoticon_PREFIX)) return;
    const emoticonRequests = extractemoticonRequestsFromMessage(content);
    if (emoticonRequests.length > MAX_emoticon_TOKENS_PER_MESSAGE) {
      await safeReply(
        message,
        `Too many emoticon requests in one message. Please limit to ${MAX_emoticon_TOKENS_PER_MESSAGE}.`
      );
      return;
    }
    if (emoticonRequests.length === 0) {
      await safeReply(message, `Usage: \`${emoticon_PREFIX}smile\` or \`${emoticon_PREFIX}all\``);
      return;
    }
    if (emoticonRequests.length === 1) {
      const singleToken = emoticonRequests[0].token.toLowerCase();
      if (!singleToken || singleToken === "all") {
        const chunks = buildemoticonListChunks();
        const sentInDm = await safeDmChunks(message.author, chunks);
        if (!sentInDm) {
          await safeReply(
            message,
            "I couldn't DM you the list. Please enable DMs from server members."
          );
        }
        await message.delete().catch(() => null);
        return;
      }
    }
    if (emoticonRequests.some((req) => !req.token)) {
      const suggestions = buildSuggestionText("", 20);
      await safeReply(
        message,
        `I could not find \`${emoticonRequests.find((req) => !req.token)?.token || ""}\` at the GIF base URL. Suggestions: ${suggestions}`
      );
      return;
    }

    if (message.guild) {
      const botMember = message.guild.members.me;
      const hasWebhookPerm =
        botMember &&
        message.channel
          .permissionsFor(botMember)
          ?.has(PermissionsBitField.Flags.ManageWebhooks);

      if (!hasWebhookPerm) {
        await safeReply(
          message,
          "I need `Manage Webhooks` permission in this channel to post emoticon GIFs."
        );
        return;
      }
    }

    const requestToName = new Map();
    const uniqueNames = new Set();
    for (const req of emoticonRequests) {
      const resolvedName = resolveemoticonName(req.token);
      if (!resolvedName) {
        const suggestions = buildSuggestionText(req.token);
        if (suggestions) {
          await safeReply(
            message,
            `I could not find \`${req.token}\` at the GIF base URL. Suggestions: ${suggestions}`
          );
        } else {
          await safeReply(message, `I could not find \`${req.token}\` at the GIF base URL.`);
        }
        return;
      }
      requestToName.set(req.full, resolvedName);
      uniqueNames.add(resolvedName);
    }

    const emoticonToUrl = new Map();
    for (const name of uniqueNames) {
      const gifUrl = `${EMOTICONS_BASE_URL}${name}.gif`;
      const exists = await gifExists(gifUrl);
      if (!exists) {
        await safeReply(
          message,
          `I could not find \`${name}.gif\` at the GIF base URL.`
        );
        return;
      }
      emoticonToUrl.set(name, gifUrl);
    }

    const transformedContent = emoticonRequests
      .reduce((acc, req) => acc.replace(req.full, ""), content)
      .replace(/\s{2,}/g, " ")
      .trim();

    const embeds = emoticonRequests.slice(0, MAX_emoticon_EMBEDS).map((req) => {
      const name = requestToName.get(req.full);
      return { image: { url: emoticonToUrl.get(name) } };
    });

    if (!message.guild) {
      await safeSend(message.channel, { content: transformedContent || undefined, embeds });
    } else {
      const webhook = await getOrCreateWebhook(message.channel);

      await webhook.send({
        content: transformedContent || undefined,
        embeds,
        username: message.member?.displayName || message.author.username,
        avatarURL: message.author.displayAvatarURL({ extension: "png", size: 128 }),
      });

      await message.delete().catch(() => null);
    }
  } catch (error) {
    console.error("Failed sending emoticon GIF:", error);
    await safeReply(
      message,
      "Could not send the emoticon GIF. Check bot permissions and webhook access."
    );
  }
});

client.on("error", (error) => {
  console.error("Discord client error:", error);
});

client.login(TOKEN);
