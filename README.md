# BatBot - Premium Discord Bot

A production-ready Discord bot with advanced security, moderation, ticketing, leveling, economy, and fun features.

## Features

### 🛡️ Security
- **Anti-Raid** - Detects mass joins, auto-lockdown, emergency mode
- **Anti-Spam** - Message/mention/emoji/URL/invite/spam detection
- **Anti-Nuker** - Detects mass channel/role/webhook actions, auto-bans executor
- **Anti-Alt** - Detects fresh accounts, suspicious usernames, no avatar
- **Anti-Token** - Monitors webhook spam and suspicious bot behavior

### 🤖 AutoMod
- Bad words, phishing, malware, fake Nitro
- Excessive caps, invite links
- Fully configurable per server

### 📋 Logging
- 30+ events logged in beautiful embeds
- Message edit/delete, member join/leave, voice, roles, channels, bans, boosts
- Command usage, security alerts, and more

### 🔨 Moderation
- Ban, softban, tempban, kick, timeout
- Warning system with case tracking
- Purge, lock, unlock, slowmode
- Permission-based command access

### 🎫 Tickets
- Dropdown category selection
- Claim/close/reopen/delete
- Automatic transcripts
- Per-user ticket limits

### 👋 Welcome
- Dynamic welcome/leave cards with Canvas
- Customizable messages
- Member count, avatar, server name

### 📈 Leveling
- XP gain per message
- Rank card and leaderboard
- Level-up notifications
- Anti-farming protection

### 💰 Economy
- Daily rewards, work for coins
- Wallet balance, transfers
- Shop-ready system

### ✅ Verification
- Button verification with role assignment
- Captcha support
- Account age checking

### 🎮 Fun
- Blackjack (interactive with buttons)
- Slots (with coin prizes)

### 🛠️ Utility
- Reminders, polls, giveaways
- User/server info, avatar
- Suggestions with voting
- Reaction roles (database-backed)

## Quick Start

1. Install Node.js 18+
2. `npm install`
3. Copy `.env.example` to `.env` and fill in your bot token
4. Run `npm start`

## Commands

### Moderation
| Command | Description | Permission |
|---------|-------------|-----------|
| `/ban` | Ban a member | Ban Members |
| `/kick` | Kick a member | Kick Members |
| `/timeout` | Timeout a member | Moderate Members |
| `/warn` | Warn a member | Moderate Members |
| `/warnings` | View warnings | Everyone |
| `/purge` | Bulk delete messages | Manage Messages |
| `/lock` | Lock a channel | Manage Channels |
| `/unlock` | Unlock a channel | Manage Channels |
| `/slowmode` | Set slowmode | Manage Channels |

### Config
| Command | Description | Permission |
|---------|-------------|-----------|
| `/setup logs` | Set log channel | Administrator |
| `/setup welcome` | Set welcome channel | Administrator |
| `/setup leave` | Set leave channel | Administrator |
| `/setup ticket_category` | Set ticket category | Administrator |
| `/setup verify` | Setup verification | Administrator |
| `/setup automod` | Toggle automod | Administrator |
| `/setup leveling` | Toggle leveling | Administrator |

### Utility
| Command | Description |
|---------|-------------|
| `/help` | List all commands |
| `/ping` | Check bot latency |
| `/userinfo` | User information |
| `/serverinfo` | Server information |
| `/avatar` | User avatar |
| `/rank` | Your XP rank |
| `/leaderboard` | Server leaderboard |
| `/reminder` | Set a reminder |
| `/poll` | Create a poll |
| `/giveaway` | Start a giveaway |
| `/suggest` | Submit suggestion |
| `/verify` | Send verification panel |

### Economy
| Command | Description |
|---------|-------------|
| `/balance` | Check coin balance |
| `/daily` | Daily reward |
| `/work` | Work for coins |
| `/pay` | Send coins |

### Games
| Command | Description |
|---------|-------------|
| `/blackjack` | Play blackjack |
| `/slots` | Play slots |

## Database

Uses SQLite via `better-sqlite3`. Migrate to PostgreSQL by replacing the database module.

## License

MIT
