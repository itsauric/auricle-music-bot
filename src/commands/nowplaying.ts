import { Command } from '@sapphire/framework';
import { QueueRepeatMode, useQueue, useTimeline } from 'discord-player';
import {
	ActionRowBuilder,
	ButtonBuilder,
	ButtonStyle,
	ComponentType,
	EmbedBuilder,
	MessageFlags,
	StringSelectMenuBuilder
} from 'discord.js';
import { BRAND_COLOR, makeEmbed } from '#lib/utils';
import { Playlist } from '#lib/schemas/Playlist';

const REPEAT_LABELS: Record<number, string> = {
	[QueueRepeatMode.OFF]: '⏹ Off',
	[QueueRepeatMode.TRACK]: '🔂 Track',
	[QueueRepeatMode.QUEUE]: '🔁 Queue',
	[QueueRepeatMode.AUTOPLAY]: '♾️ Autoplay'
};

function buildEmbed(queue: NonNullable<ReturnType<typeof useQueue>>, timeline: ReturnType<typeof useTimeline>) {
	const track = queue.currentTrack!;
	const progressBar = queue.node.createProgressBar({ length: 13 });
	const progress = timeline?.timestamp?.progress ?? 0;
	const loopMode = REPEAT_LABELS[queue.repeatMode] ?? '⏹ Off';

	return new EmbedBuilder()
		.setColor(BRAND_COLOR)
		.setAuthor({
			name: '🎵 Now Playing',
			iconURL: track.requestedBy?.displayAvatarURL() ?? undefined
		})
		.setTitle(track.title.slice(0, 256))
		.setURL(track.url)
		.setDescription(`by **${track.author || 'Unknown'}**`)
		.setThumbnail(track.thumbnail ?? null)
		.addFields([
			{ name: '⏱ Duration', value: `\`${track.duration || 'Unknown'}\``, inline: true },
			{ name: '🔁 Loop', value: loopMode, inline: true },
			...(track.requestedBy ? [{ name: '👤 Requested by', value: `<@${track.requestedBy.id}>`, inline: true }] : []),
			{ name: '📊 Progress', value: `${progressBar ?? '─'.repeat(13)} (${progress}%)`, inline: false }
		])
		.setFooter({ text: `${queue.ping > 0 ? `Ping: ${queue.ping}ms  •  ` : ''}${queue.tracks.size} track${queue.tracks.size === 1 ? '' : 's'} remaining` });
}

export class NowPlayingCommand extends Command {
	public constructor(context: Command.LoaderContext, options: Command.Options) {
		super(context, {
			...options,
			description: 'Displays the current track with a live-refresh button'
		});
	}

	public override registerApplicationCommands(registry: Command.Registry) {
		registry.registerChatInputCommand((builder) => {
			builder //
				.setName(this.name)
				.setDescription(this.description);
		});
	}

	public override async chatInputRun(interaction: Command.ChatInputCommandInteraction) {
		const { emojis } = this.container.client.utils;
		const queue = useQueue(interaction.guild!.id);
		const timeline = useTimeline({ node: interaction.guild!.id });

		if (!queue) return interaction.reply({ embeds: [makeEmbed(`${emojis.error} | I am **not** in a voice channel`)], flags: MessageFlags.Ephemeral });
		if (!queue.currentTrack)
			return interaction.reply({ embeds: [makeEmbed(`${emojis.error} | There is no track **currently** playing`)], flags: MessageFlags.Ephemeral });

		const refreshButton = new ButtonBuilder()
			.setCustomId('nowplaying_refresh')
			.setLabel('Refresh')
			.setEmoji('🔄')
			.setStyle(ButtonStyle.Secondary);

		const saveButton = new ButtonBuilder()
			.setCustomId('nowplaying_save')
			.setLabel('Add to Playlist')
			.setEmoji('📋')
			.setStyle(ButtonStyle.Secondary);

		const row = new ActionRowBuilder<ButtonBuilder>().addComponents(refreshButton, saveButton);
		const response = await interaction.reply({ embeds: [buildEmbed(queue, timeline)], components: [row], withResponse: true });
		const message = response.resource!.message!;

		const collector = message.createMessageComponentCollector({
			componentType: ComponentType.Button,
			time: 300_000,
			filter: (i) => i.customId === 'nowplaying_refresh' || (i.customId === 'nowplaying_save' && i.user.id === interaction.user.id)
		});

		collector.on('collect', async (i) => {
			const currentQueue = useQueue(interaction.guild!.id);
			const currentTimeline = useTimeline({ node: interaction.guild!.id });

			if (i.customId === 'nowplaying_refresh') {
				if (!currentQueue?.currentTrack) {
					await i.update({ embeds: [makeEmbed(`${emojis.error} | No track is currently playing`)], components: [] });
					collector.stop();
					return;
				}
				await i.update({ embeds: [buildEmbed(currentQueue, currentTimeline)] });
				return;
			}

			// Add to Playlist flow - show a select menu with user's playlists
			let playlists: Awaited<ReturnType<typeof Playlist.find>>;
			try {
				playlists = await Playlist.find({ userId: i.user.id }).select('name tracks').lean();
			} catch {
				await i.reply({ embeds: [makeEmbed(`${emojis.error} | Database error - please try again`)], flags: MessageFlags.Ephemeral });
				return;
			}

			if (!playlists.length) {
				await i.reply({
					embeds: [makeEmbed(`${emojis.error} | You have no playlists - create one with \`/playlist create\``)],
					flags: MessageFlags.Ephemeral
				});
				return;
			}

			const track = currentQueue?.currentTrack;
			if (!track) {
				await i.reply({ embeds: [makeEmbed(`${emojis.error} | No track is currently playing`)], flags: MessageFlags.Ephemeral });
				return;
			}

			const menu = new StringSelectMenuBuilder()
				.setCustomId('nowplaying_playlist_select')
				.setPlaceholder('Select a playlist...')
				.addOptions(
					playlists.map((p) => ({
						label: p.name.slice(0, 100),
						description: `${p.tracks.length} track${p.tracks.length !== 1 ? 's' : ''}`,
						value: p.name
					}))
				);

			const selectRow = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(menu);
			const selectReply = await i.reply({
				embeds: [makeEmbed(`${emojis.playlist} | Which playlist would you like to add **${track.title}** to?`)],
				components: [selectRow],
				flags: MessageFlags.Ephemeral,
				withResponse: true
			});

			const selectCollector = selectReply.resource!.message!.createMessageComponentCollector({
				componentType: ComponentType.StringSelect,
				time: 30_000,
				max: 1
			});

			selectCollector.on('collect', async (sel) => {
				const playlistName = sel.values[0];
				try {
					const playlist = await Playlist.findOne({ userId: i.user.id, name: playlistName });

					if (!playlist) {
						await sel.update({ embeds: [makeEmbed(`${emojis.error} | Playlist not found`)], components: [] });
						return;
					}

					if (playlist.tracks.some((t) => t.url === track.url)) {
						await sel.update({ embeds: [makeEmbed(`${emojis.warning} | **${track.title}** is already in **${playlistName}**`)], components: [] });
						return;
					}

					await playlist.updateOne({
						$push: {
							tracks: {
								title: track.title,
								url: track.url,
								author: track.author,
								duration: track.duration,
								durationMS: track.durationMS,
								thumbnail: track.thumbnail,
								addedAt: new Date()
							}
						}
					});

					await sel.update({ embeds: [makeEmbed(`${emojis.playlist} | Added **${track.title}** to **${playlistName}**`)], components: [] });
				} catch {
					await sel.update({ embeds: [makeEmbed(`${emojis.error} | Database error - please try again`)], components: [] });
				}
			});

			selectCollector.on('end', (collected) => {
				if (!collected.size) {
					i.editReply({ components: [] }).catch(() => null);
				}
			});
		});

		collector.on('end', (_, reason) => {
			if (reason !== 'user') {
				interaction.editReply({ components: [] }).catch(() => null);
			}
		});
	}
}
