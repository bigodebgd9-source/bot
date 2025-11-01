const client = new Client({ intents: [GatewayIntentBits.Guilds] });

client.once('ready', () => {
  console.log(`Logado como ${client.user.tag}`);
});

client.on('interactionCreate', async interaction => {
  if (!interaction.isChatInputCommand()) return;
  const data = loadData();
  const channelId = interaction.channelId;
  if (!data.channels[channelId]) data.channels[channelId] = { queue: [], size: 2 };
  const channelData = data.channels[channelId];

  if (interaction.commandName === 'join') {
    const userId = interaction.user.id;
    if (channelData.queue.includes(userId)) {
      await interaction.reply({ content: 'Você já está na fila.', ephemeral: true });
      return;
    }
    channelData.queue.push(userId);
    saveData(data);
    await interaction.reply({ content: `Você entrou na fila. Posição: ${channelData.queue.length}`, ephemeral: true });

    if (channelData.queue.length >= channelData.size) {
      const players = channelData.queue.splice(0, channelData.size);
      saveData(data);
      const mentions = players.map(id => `<@${id}>`).join(', ');
      await interaction.followUp({ content: `Partida formada: ${mentions}` });
    }

  } else if (interaction.commandName === 'leave') {
    const userId = interaction.user.id;
    const idx = channelData.queue.indexOf(userId);
    if (idx === -1) {
      await interaction.reply({ content: 'Você não está na fila.', ephemeral: true });
      return;
    }
    channelData.queue.splice(idx, 1);
    saveData(data);
    await interaction.reply({ content: 'Você saiu da fila.', ephemeral: true });

  } else if (interaction.commandName === 'queue') {
    if (channelData.queue.length === 0) {
      await interaction.reply({ content: 'Fila vazia.' });
      return;
    }
    const lines = channelData.queue.map((id, i) => `${i + 1}. <@${id}>`);
    await interaction.reply({ content: `Fila atual (tamanho para partida: ${channelData.size}):\n${lines.join('\n')}` });

  } else if (interaction.commandName === 'setsize') {
    const newSize = interaction.options.getInteger('size');
    if (newSize < 1 || newSize > 100) {
      await interaction.reply({ content: 'Tamanho inválido (1-100).', ephemeral: true });
      return;
    }
    channelData.size = newSize;
    saveData(data);
    await interaction.reply({ content: `Tamanho da partida definido para ${newSize}.`, ephemeral: true });

    while (channelData.queue.length >= channelData.size) {
      const players = channelData.queue.splice(0, channelData.size);
      saveData(data);
      const mentions = players.map(id => `<@${id}>`).join(', ');
      await interaction.followUp({ content: `Partida formada: ${mentions}` });
    }
  }
});

client.login(MTQzMzkyMDQ4MzU2NDMyMjg0Ng.GjLfVG.-Ks3QffcsBkK3TJcZjtPahCGH7oIDSCFSYfsOA);
