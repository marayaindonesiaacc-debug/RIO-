module.exports = {
  pattern: 'time',
  function: async (sock, mek, { reply }) => {
    const now = new Date().toUTCString();
    await reply(`🕒 Server time: ${now}`);
  },
};
