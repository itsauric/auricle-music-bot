[![Sponsor itsauric](https://img.shields.io/badge/Sponsor-itsauric-pink?style=for-the-badge&logo=github)](https://github.com/sponsors/itsauric)

# Auricle

A feature-rich Discord music bot built with [Sapphire Framework][sapphire] and [discord-player][discord-player], written in TypeScript.

Supports YouTube, SoundCloud, Spotify, and more — with audio filters, an interactive now-playing card, slash commands, and a full queue management system.

## Features

- **Multi-source playback** — YouTube, SoundCloud, Spotify, Apple Music, and direct links
- **Interactive now-playing card** — Pause/Resume and Skip buttons directly on the embed
- **Full queue management** — Add, remove, move, skip, shuffle, and clear tracks
- **Audio processing** — FFmpeg filters, biquad filters, equaliser presets, and PCM effects all under `/audio`
- **Lyrics** — Fetch lyrics for the currently playing track
- **Hot Module Reloading** — Live reload commands without restarting (development mode)
- **Slash commands** — Full Discord application command support with autocomplete

## Commands

| Command | Description |
|---|---|
| `/play` | Play a track or playlist from a URL or search query |
| `/playnext` | Add a track to the front of the queue |
| `/search` | Search and select a track interactively |
| `/stop` | Stop playback |
| `/skip` | Skip the current track |
| `/skipto` | Skip to a specific position in the queue |
| `/previous` | Play the previous track |
| `/replay` | Replay the current track from the beginning |
| `/seek` | Seek to a timestamp in the current track |
| `/pause` | Pause the current track |
| `/nowplaying` | Show the currently playing track |
| `/queue` | Show the current queue |
| `/history` | Show playback history |
| `/loop` | Set loop mode (off, track, queue, autoplay) |
| `/autoplay` | Toggle autoplay |
| `/shuffle` | Shuffle the queue |
| `/clear` | Clear the queue |
| `/remove` | Remove a track from the queue |
| `/move` | Move a track to a different position |
| `/jump` | Jump to a position in the queue |
| `/volume` | Adjust the playback volume |
| `/audio filter` | Toggle an FFmpeg audio filter |
| `/audio equaliser` | Apply an equaliser preset |
| `/audio biquad` | Apply a biquad filter |
| `/audio effects` | Toggle a PCM audio effect |
| `/lyrics` | Fetch lyrics for the current track |
| `/save` | Save the current track to your DMs |
| `/connect` | Connect to a voice channel |
| `/disconnect` | Disconnect from the voice channel |
| `/ping` | Check the bot's latency |

## Prerequisites

- **Node.js** v18 or higher
- **FFmpeg** (installed globally, or bundled via `ffmpeg-static`)
- **Yarn** package manager

## Installation

```bash
git clone https://github.com/itsauric/auricle-music-bot.git
cd auricle-music-bot
yarn install
```

## Configuration

Create a `src/.env` file:

```env
DISCORD_TOKEN=your_discord_bot_token
OWNERS=your_user_id,another_user_id
```

- `DISCORD_TOKEN` — your bot token from the [Discord Developer Portal](https://discord.com/developers/applications)
- `OWNERS` — comma-separated list of user IDs that have owner-level access (devOnly commands, cooldown bypass)

## Running

```bash
# Build
yarn build

# Start
yarn start

# Development (watch + start)
yarn auricle
```

## Stack

- [discord.js](https://discord.js.org/) v14
- [Sapphire Framework](https://sapphirejs.dev/) — commands, listeners, preconditions, subcommands
- [discord-player](https://discord-player.js.org/) v7 — audio engine
- [@discord-player/extractor](https://github.com/Androz2091/discord-player) — source extractors
- [discord-player-googlevideo](https://github.com/yt-dlp/yt-dlp) — YouTube streaming via SABR
- [SWC](https://swc.rs/) — TypeScript compilation

## Contributing

Pull requests are welcome. Please open an issue first for significant changes.

## License

MIT — see [LICENSE](LICENSE) for details.

[sapphire]: https://github.com/sapphiredev/framework
[discord-player]: https://github.com/Androz2091/discord-player
