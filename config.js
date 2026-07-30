module.exports = {
  PREFIX: process.env.PREFIX || '.',
  OWNER_NUMBER: process.env.OWNER_NUMBER || '', // e.g. 94701234567 (no + or spaces)
  BOT_NAME: process.env.BOT_NAME || 'Rio MD',
  MODE: process.env.MODE || 'public', // public | private
  AUTO_READ_STATUS: process.env.AUTO_READ_STATUS || 'false', // true | false
};
