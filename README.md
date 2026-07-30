# Rio MD

A simple, clean WhatsApp bot built with Baileys.

## Local setup

```bash
npm install
npm start
```

On first run, a QR code will print in the terminal. Open WhatsApp on your
phone → **Settings → Linked Devices → Link a Device** → scan the QR code.

Once scanned, the bot stays connected and saves its session in the
`auth_info/` folder (do not commit this folder — it's already in
`.gitignore`).

## Commands

- `.ping` — check bot latency
- `.menu` — show all commands
- `.alive` — check if the bot is running
- `.time` — show server time

Add more by creating a new file in `plugins/` (see existing files for the
pattern).

## Environment variables

| Variable | Default | Description |
|---|---|---|
| `PREFIX` | `.` | Command prefix |
| `OWNER_NUMBER` | (empty) | Your WhatsApp number, digits only, e.g. `94701234567` |
| `BOT_NAME` | `Rio MD` | Display name |
| `MODE` | `public` | `public` or `private` (private = only owner can use commands) |
| `AUTO_READ_STATUS` | `false` | `true`/`false` |
| `PORT` | `8000` | Set automatically by Railway |

## Deploying to Railway

1. Push this project to a GitHub repo.
2. Go to [railway.app](https://railway.app) → **New Project** → **Deploy from GitHub repo**.
3. Select your repo.
4. In the Railway project settings, add the environment variables above
   (at least set `OWNER_NUMBER`).
5. Deploy. Once it's running, open the **Deploy Logs** — the QR code will
   print there.
6. Scan the QR from the logs with your phone within the time limit shown.

**Important:** Railway's free/starter plans reset the filesystem on
redeploys, which will delete `auth_info/` and force you to re-scan the QR
each time you redeploy. For a persistent session across redeploys, add a
[Railway Volume](https://docs.railway.com/reference/volumes) mounted at
`/app/auth_info`.
