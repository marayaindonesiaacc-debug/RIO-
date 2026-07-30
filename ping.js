module.exports = {
  pattern: 'ping',
  alias: ['p'],
  function: async (sock, mek, { reply }) => {
    const start = Date.now();
    await reply('Pinging...');
    const latency = Date.now() - start;
    await reply(`🏓 Pong! ${latency}ms`);
  },
};
