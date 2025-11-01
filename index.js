/*
Discord Queue Bot
Filename: index.js
Language: JavaScript (Node.js) using discord.js v14

What it does:
- /join     -> entra na fila do canal onde foi usado
- /leave    -> sai da fila
- /queue    -> mostra a fila atual
- /setsize  -> configura quantos jogadores formam uma partida (default 2)
- Quando a fila atingir o tamanho configurado, o bot automaticamente cria uma "partida" e remove esses jogadores da fila, postando quem foi agrupado.

How to use:
1. Node 18+ installed
2. npm init -y
3. npm install discord.js@14 node-fetch@2
4. Create a bot application on Discord dev portal and get BOT_TOKEN
5. Create a file .env with:
   BOT_TOKEN=your_token_here
   GUILD_ID=your_test_guild_id
6. Run: node index.js

Notes:
- This is a minimal, single-file example meant to be easy to run and extend.
- Persistence is a simple JSON file (queues.json) stored next to the script. For production use SQLite or a real DB.
- The script registers guild slash commands on startup (fast development). Remove or change for global commands.
*/

const { Client, GatewayIntentBits, Partials, REST, Routes, SlashCommandBuilder } = require('discord.js');
const fs = require('fs');
require('dotenv').config();

const TOKEN = process.env.BOT_TOKEN;
const GUILD_ID = process.env.GUILD_ID; // for development, register commands to one guild
if (!TOKEN || !GUILD_ID) {
  console.error('Missing BOT_TOKEN or GUILD_ID in .env');
  process.exit(1);
}

const DATA_FILE = './queues.json';
function loadData() {
  try {
    return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
  } catch (e) {
    return { channels: {} };
  }
}
function saveData(data) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

const commands = [
  new SlashCommandBuilder().setName('join').setDescription('Entrar na fila do canal atual'),
  new SlashCommandBuilder().setName('leave').setDescription('Sair da fila do canal atual'),
  new SlashCommandBuilder().setName('queue').setDescription('Mostrar a fila do canal atual'),
  new SlashCommandBuilder().setName('setsize').setDescription('Configura o tamanho da partida').addIntegerOption(opt => opt.setName('size').setDescription('Tamanho (ex: 2)').setRequired(true)),
].map(cmd => cmd.toJSON());

const rest = new REST({ version: '10' }).setToken(TOKEN);
(async () => {
  try {
    console.log('Registrando comandos no guild...');
    await rest.put(Routes.applicationGuildCommands((await rest.get(Routes.oauth2CurrentApplication())).id, GUILD_ID), { body: commands });
    console.log('Comandos registrados.');
  } catch (err) {
    console.error('Erro registrando comandos:', err);
  }
})();

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

client.once('ready', () => {
  console.log(Logado como ${client.user.tag});
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
    await interaction.reply({ content: Você entrou na fila. Posição: ${channelData.queue.length}, ephemeral: true });

    // Se a fila atingiu o tamanho, forma partida
    if (channelData.queue.length >= channelData.size) {
      const players = channelData.queue.splice(0, channelData.size);
      saveData(data);
      const mentions = players.map(id => <@${id}>).join(', ');
      await interaction.followUp({ content: Partida formada: ${mentions} });
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
    const lines = channelData.queue.map((id, i) => ${i+1}. <@${id}>);
    await interaction.reply({ content: Fila atual (tamanho para partida: ${channelData.size}):\n${lines.join('\n')} });

  } else if (interaction.commandName === 'setsize') {
    const newSize = interaction.options.getInteger('size');
    if (newSize < 1 || newSize > 100) {
      await interaction.reply({ content: 'Tamanho inválido (1-100).', ephemeral: true });
      return;
    }
    channelData.size = newSize;
    saveData(data);
    await interaction.reply({ content: Tamanho da partida definido para ${newSize}., ephemeral: true });

    // Se fila já tem jogadores suficientes, formar partidas até não ser possível
    while (channelData.queue.length >= channelData.size) {
      const players = channelData.queue.splice(0, channelData.size);
      saveData(data);
      const mentions = players.map(id => <@${id}>).join(', ');
      await interaction.followUp({ content: Partida formada: ${mentions} });
    }
  }
});

client.login(MTQzMzkyMDQ4MzU2NDMyMjg0Ng.GjLfVG.-Ks3QffcsBkK3TJcZjtPahCGH7oIDSCFSYfsOA);