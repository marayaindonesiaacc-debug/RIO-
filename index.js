const {
  default: makeWASocket,
  useMultiFileAuthState,
  DisconnectReason,
  fetchLatestBaileysVersion,
  Browsers,
  getContentType,
} = require('@whiskeysockets/baileys');
const { Boom } = require('@hapi/boom');
const pino = require('pino');
const fs = require('fs');
const path = require('path');
const qrcode = require('qrcode-terminal');
const express = require('express');
const config = require('./config');

const AUTH_DIR = path.join(__dirname, 'auth_info');
const commands = [];

// ---- plugin loader ----
function loadPlugins() {
  const pluginsDir = path.join(__dirname, 'plugins');
  if (!fs.existsSync(pluginsDir)) fs.mkdirSync(pluginsDir, { recursive: true });
  const files = fs.readdirSync(pluginsDir).filter((f) => f.endsWith('.js'));
  for (const file of files) {
    try {
      const plugin = require(path.join(pluginsDir, file));
      if (plugin && plugin.pattern && typeof plugin.function === 'function') {
        commands.push(plugin);
        console.log(`[plugin] loaded: ${plugin.pattern}`);
      }
    } catch (e) {
      console.error(`[plugin] failed to load ${file}:`, e.message);
    }
  }
}

function extractText(message) {
  if (!message) return '';
  const type = getContentType(message);
  if (type === 'conversation') return message.conversation;
  if (type === 'extendedTextMessage') return message.extendedTextMessage.text;
  if (type === 'imageMessage') return message.imageMessage.caption || '';
  if (type === 'videoMessage') return message.videoMessage.caption || '';
  return '';
}

async function startBot() {
  if (!fs.existsSync(AUTH_DIR)) fs.mkdirSync(AUTH_DIR, { recursive: true });

  const { state, saveCreds } = await useMultiFileAuthState(AUTH_DIR);
  const { version } = await fetchLatestBaileysVersion();

  const sock = makeWASocket({
    version,
    auth: state,
    logger: pino({ level: 'silent' }),
    printQRInTerminal: false,
    browser: Browsers.macOS('Chrome'),
  });

  sock.ev.on('creds.update', saveCreds);

  sock.ev.on('connection.update', (update) => {
    const { connection, lastDisconnect, qr } = update;

    if (qr) {
      console.log('\nScan this QR code with WhatsApp (Linked Devices):\n');
      qrcode.generate(qr, { small: true });
    }

    if (connection === 'close') {
      const statusCode = lastDisconnect?.error instanceof Boom
        ? lastDisconnect.error.output.statusCode
        : null;
      const shouldReconnect = statusCode !== DisconnectReason.loggedOut;
      console.log('Connection closed.', statusCode, 'Reconnecting:', shouldReconnect);
      if (shouldReconnect) {
        startBot();
      } else {
        console.log('Logged out. Delete the auth_info folder and restart to re-pair.');
      }
    } else if (connection === 'open') {
      console.log(`✅ ${config.BOT_NAME} connected to WhatsApp.`);
    }
  });

  sock.ev.on('messages.upsert', async ({ messages }) => {
    try {
      const mek = messages[0];
      if (!mek.message) return;

      const messageContent =
        mek.message.ephemeralMessage?.message || mek.message;
      const body = extractText(messageContent);
      if (!body) return;

      const from = mek.key.remoteJid;
      const isGroup = from.endsWith('@g.us');
      const sender = mek.key.fromMe
        ? sock.user.id.split(':')[0] + '@s.whatsapp.net'
        : (mek.key.participant || from);
      const senderNumber = sender.split('@')[0];
      const isOwner = config.OWNER_NUMBER && senderNumber === config.OWNER_NUMBER;

      const isCmd = body.startsWith(config.PREFIX);
      if (!isCmd) return;

      const withoutPrefix = body.slice(config.PREFIX.length).trim();
      const commandName = withoutPrefix.split(' ')[0].toLowerCase();
      const args = withoutPrefix.split(' ').slice(1);
      const q = args.join(' ');

      if (config.MODE === 'private' && !isOwner) return;

      const reply = (text) => sock.sendMessage(from, { text }, { quoted: mek });

      const cmd = commands.find(
        (c) => c.pattern === commandName || (c.alias && c.alias.includes(commandName))
      );

      if (cmd) {
        try {
          await cmd.function(sock, mek, {
            from,
            body,
            args,
            q,
            isGroup,
            sender,
            senderNumber,
            isOwner,
            reply,
            config,
          });
        } catch (err) {
          console.error(`[cmd:${commandName}] error:`, err);
          reply('❌ Something went wrong running that command.');
        }
      }

      if (config.AUTO_READ_STATUS === 'true' && from === 'status@broadcast') {
        await sock.readMessages([mek.key]);
      }
    } catch (err) {
      console.error('Message handler error:', err);
    }
  });
}

loadPlugins();
startBot();

// ---- express server (keeps Railway happy / health check) ----
const app = express();
const port = process.env.PORT || 8000;

app.get('/', (req, res) => {
  res.send(`${config.BOT_NAME} is running ✅`);
});

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
