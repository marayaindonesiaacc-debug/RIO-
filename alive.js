module.exports = {
  pattern: 'alive',
  function: async (sock, mek, { reply, config }) => {
    await reply(`✅ ${config.BOT_NAME} is alive and running!`);
  },
};
