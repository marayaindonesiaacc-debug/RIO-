module.exports = {
  pattern: 'menu',
  alias: ['help'],
  function: async (sock, mek, { reply, config }) => {
    const menuText = `
*${config.BOT_NAME}*
Prefix: ${config.PREFIX}

*Commands*
${config.PREFIX}ping - check bot latency
${config.PREFIX}menu - show this menu
${config.PREFIX}alive - check if bot is running
${config.PREFIX}time - current server time

_Simple, clean, and open source._
`.trim();
    await reply(menuText);
  },
};
