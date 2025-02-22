const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionsBitField } = require('discord.js');
const { joinVoiceChannel, createAudioPlayer, createAudioResource, AudioPlayerStatus, StreamType } = require('@discordjs/voice');
const play = require('play-dl');
const fs = require('fs');
const path = require('path');


const ALLOWED_CHANNEL = '1341084424443531358';

let currentSong = null;
let queue = new Map();
let player = createAudioPlayer();
let connection = null;

function debugLog(message, error = null) {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] ${message}`;
    console.log(logMessage);
    if (error) {
        console.error(`[${timestamp}] Error:`, error);
    }
}

const convertHMS = (value) => {
    if (!value) return "N/A";
    const duration = Number(value);
    const hours = Math.floor(duration / 3600);
    const minutes = Math.floor((duration % 3600) / 60);
    const seconds = Math.floor(duration % 60);

    if (hours > 0) {
        return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
};

async function searchSong(query) {
    try {
        debugLog(`Searching for song: ${query}`);
        const results = await play.search(query, { limit: 5 });
        if (!results?.length) {
            throw new Error('No songs found');
        }

        const songs = results.map(video => ({
            title: video.title,
            url: video.url,
            channel: video.channel.name,
            duration: convertHMS(video.durationInSec)
        }));

        return songs;
    } catch (error) {
        debugLog('Error searching songs', error);
        throw error;
    }
}

async function playSong(guildId, song) {
    try {
        if (!song) {
            if (connection) {
                connection.destroy();
                connection = null;
            }
            return;
        }

        debugLog(`Starting playback of: ${song.title}`);

        // Get stream with opus encoding
        const { stream, type } = await play.stream(song.url, {
            discordPlayerCompatibility: true,
            quality: 0,
            opusEncoded: true
        });
        const resource = createAudioResource(stream, {
            inputType: type,
            inlineVolume: true,
            silencePaddingFrames: 1
        });

        if (!resource) {
            throw new Error('Failed to create audio resource');
        }

        resource.volume.setVolume(1.0);
        player.play(resource);
        currentSong = song;
        
        const serverQueue = queue.get(guildId);
        if (serverQueue) {
            updateNowPlaying(serverQueue.textChannel);
        }

        player.on(AudioPlayerStatus.Idle, () => {
            debugLog('Player is idle, moving to next song');
            const serverQueue = queue.get(guildId);
            if (serverQueue) {
                serverQueue.songs.shift();
                playSong(guildId, serverQueue.songs[0]);
            }
        });

        player.on('error', error => {
            debugLog('Player error occurred', error);
            const serverQueue = queue.get(guildId);
            if (serverQueue) {
                serverQueue.textChannel.send(`❌ Error playing song: ${error.message}`);
            }
        });

    } catch (error) {
        debugLog('Error in playSong', error);
        const serverQueue = queue.get(guildId);
        if (serverQueue) {
            serverQueue.textChannel.send(`❌ Error playing song: ${error.message}`);
        }
    }
}

async function updateNowPlaying(channel) {
    if (!currentSong) return;

    const embed = new EmbedBuilder()
        .setColor(0x2B2D31)
        .setTitle('🎵 Now Playing')
        .setDescription(`[${currentSong.title}](${currentSong.url})`)
        .addFields([
            {
                name: '🎤 Channel',
                value: currentSong.channel,
                inline: true
            },
            {
                name: '⏱️ Duration',
                value: currentSong.duration,
                inline: true
            }
        ])
        .setTimestamp()
        .setFooter({ text: 'Music Bot by HN' });

    const row = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId('pause')
                .setLabel('⏸️ Pause')
                .setStyle(ButtonStyle.Primary),
            new ButtonBuilder()
                .setCustomId('skip')
                .setLabel('⏭️ Skip')
                .setStyle(ButtonStyle.Primary),
            new ButtonBuilder()
                .setCustomId('stop')
                .setLabel('⏹️ Stop')
                .setStyle(ButtonStyle.Danger)
        );

    await channel.send({
        embeds: [embed],
        components: [row]
    });
}

async function showSearchResults(message, songs) {
    const embed = new EmbedBuilder()
        .setColor(0x2B2D31)
        .setTitle('🔍 Search Results')
        .setDescription(
            songs.map((song, index) => 
                `${index + 1}. [${song.title}](${song.url})\n└── 🎤 ${song.channel}\n└── ⏱️ ${song.duration}`
            ).join('\n\n')
        )
        .setTimestamp()
        .setFooter({ text: 'Music Bot by HN' });

    const rows = [];
    const buttons = songs.map((_, index) => 
        new ButtonBuilder()
            .setCustomId(`select_${index}`)
            .setLabel(`${index + 1}`)
            .setStyle(ButtonStyle.Primary)
    );

    for (let i = 0; i < buttons.length; i += 5) {
        const row = new ActionRowBuilder()
            .addComponents(buttons.slice(i, i + 5));
        rows.push(row);
    }

    return message.channel.send({
        embeds: [embed],
        components: rows
    });
}

module.exports = {
    name: 'music',
    description: 'Play music in voice channel',
    usage: 'music <song name/URL>',
    execute: async function(message, args) {
        try {
            // Check channel permission
            if (message.channel.id !== ALLOWED_CHANNEL) {
                return message.reply('❌ This command can only be used in the music channel!');
            }

            // Check voice channel
            const { channel } = message.member.voice;
            if (!channel) {
                return message.reply('❌ You need to be in a voice channel to use this command!');
            }

            // Check bot permissions
            const permissions = channel.permissionsFor(message.client.user);
            if (!permissions.has(PermissionsBitField.Flags.Connect)) {
                return message.reply('❌ I need permission to join your voice channel!');
            }
            if (!permissions.has(PermissionsBitField.Flags.Speak)) {
                return message.reply('❌ I need permission to speak in your voice channel!');
            }
            if (!permissions.has(PermissionsBitField.Flags.UseVAD)) {
                return message.reply('❌ I need permission to use voice activity!');
            }

            debugLog(`Executing music command in ${message.guild.name}`);

            if (!args.length) {
                return message.reply('❌ Please provide a song name or URL!');
            }

            debugLog('Starting music playback');

            const query = args.join(' ');
            const songs = await searchSong(query);
            
            if (!songs.length) {
                return message.reply('❌ No songs found!');
            }

            const searchMessage = await showSearchResults(message, songs);

            const collector = searchMessage.createMessageComponentCollector({
                filter: i => i.user.id === message.author.id,
                time: 30000
            });

            collector.on('collect', async interaction => {
                const choice = parseInt(interaction.customId.split('_')[1]);
                const selectedSong = songs[choice];

                if (!queue.has(message.guild.id)) {
                    const queueConstruct = {
                        textChannel: message.channel,
                        voiceChannel: channel,
                        songs: [],
                        volume: 100,
                        playing: true
                    };
                    queue.set(message.guild.id, queueConstruct);
                    queueConstruct.songs.push(selectedSong);

                    try {
                        debugLog(`Joining voice channel in ${message.guild.name}`);
                        connection = joinVoiceChannel({
                            channelId: channel.id,
                            guildId: channel.guild.id,
                            adapterCreator: channel.guild.voiceAdapterCreator,
                        });
                        connection.subscribe(player);
                        await playSong(message.guild.id, queueConstruct.songs[0]);
                        await interaction.update({ content: `✅ Now playing: **${selectedSong.title}**`, components: [] });
                    } catch (error) {
                        debugLog('Error joining voice channel', error);
                        queue.delete(message.guild.id);
                        await interaction.update({ content: `❌ Error: ${error.message}`, components: [] });
                    }
                } else {
                }
            });

        } catch (error) {
            debugLog('Error executing music command', error);
            message.channel.send(`❌ Error: ${error.message}`);
        }
    }
};
