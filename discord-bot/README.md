# Yahoo emoticons Discord Bot

Posts Yahoo emoticon GIF links via:

- `!gif-name` or `!symbol` in normal messages
- `/y` slash command with autocomplete

## 1) Prerequisites

- Node.js version 18+
- A Discord bot application/token
- Bot invited to your server with:
  - `Read Messages/View Channels`
  - `Send Messages`
  - `Manage Webhooks`
  - `Read Message History`
- In Discord Developer Portal, enable `MESSAGE CONTENT INTENT` for the bot.
  - Required if you want the `!emoticon` (message-based) commands to work in servers and DMs.

## 2) Configure

1. Copy `.env.example` to `.env`
2. Fill values:
   - `DISCORD_TOKEN`: your bot token
   - `EMOTICONS_BASE_URL`: raw base folder URL ending with `/`
     - Example:
       `https://raw.githubusercontent.com/<user>/<repo>/main/assets/yahoo-emoticons/`
   - Optional (audibles):
      - `AUDIBLES_BASE_URL`: base folder URL ending with `/`
        - GitHub raw URL example:
          `https://raw.githubusercontent.com/alexpreli/yahoo-emoticons-discord/main/assets/yahoo-audibles/`
  - Optional:
    - `WEBHOOK_NAME` (default `YahooBot`)
    - `WEBHOOK_AVATAR_URL`
    - `GUILD_ID`: register slash commands in one guild (recommended while testing)

## 3) Run locally

```bash
npm install
npm start
```

Then type in Discord:

`!emoticon`

or use slash command:

`/y` (full emoticon list)  
`/y all` (full emoticon list)  
`/y emoticon` (single emoticon)

## 4) Upload GIF files

Make sure your GIFs are uploaded to the base URL you provided in the .env file.

The bot builds links as:

`<EMOTICONS_BASE_URL><emoticon-name>.gif`


## Notes


- DMs:
  - By default the bot **ignores all normal DM messages** sent to it (including `!` commands).
  - To allow `!` commands in bot's DM, set `ALLOW_DM_PREFIX_COMMANDS=true` in `.env`.
  - (No webhooks in DMs; the bot sends embeds directly).
  - `/y` and `/ya` in DMs may require enabling "User Install" for your app in the Discord Developer Portal, depending on your app’s installation settings.
