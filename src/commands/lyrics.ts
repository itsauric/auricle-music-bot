import { PaginatedMessage } from '@sapphire/discord.js-utilities';
import { Command } from '@sapphire/framework';
import { useQueue } from 'discord-player';
import { Client as GeniusClient } from 'genius-lyrics';
import { MessageFlags } from 'discord.js';
import { BRAND_COLOR } from '#lib/utils';

const CHUNK_SIZE = 4000;

function chunkLyrics(lyrics: string): string[] {
	const lines = lyrics.split('\n');
	const chunks: string[] = [];
	let current = '';

	for (const line of lines) {
		if ((current + '\n' + line).length > CHUNK_SIZE) {
			chunks.push(current.trim());
			current = line;
		} else {
			current += (current ? '\n' : '') + line;
		}
	}

	if (current.trim()) chunks.push(current.trim());
	return chunks;
}

export class LyricsCommand extends Command {
	public constructor(context: Command.LoaderContext, options: Command.Options) {
		super(context, {
			...options,
			description: 'Displays lyrics for the current or specified track'
		});
	}

	public override registerApplicationCommands(registry: Command.Registry) {
		registry.registerChatInputCommand((builder) => {
			builder //
				.setName(this.name)
				.setDescription(this.description)
				.addStringOption((option) =>
					option.setName('track').setDescription('Track to search lyrics for (defaults to current track)')
				);
		});
	}

	public override async chatInputRun(interaction: Command.ChatInputCommandInteraction) {
		const { emojis } = this.container.client.utils;
		const queue = useQueue(interaction.guild!.id);
		const trackInput = interaction.options.getString('track');
		const searchQuery = trackInput ?? queue?.currentTrack?.title;

		if (!searchQuery)
			return interaction.reply({
				content: `${emojis.error} | Provide a track name or start playing something first`,
				flags: MessageFlags.Ephemeral
			});

		await interaction.deferReply();

		const token = process.env.GENIUS_TOKEN;
		const genius = new GeniusClient(token);

		try {
			const songs = await genius.songs.search(searchQuery);
			if (!songs.length)
				return interaction.editReply({ content: `${emojis.error} | No lyrics found for **${searchQuery}**` });

			const song = songs[0];
			const lyrics = await song.lyrics();

			if (!lyrics?.trim())
				return interaction.editReply({ content: `${emojis.error} | No lyrics available for **${song.title}**` });

			const chunks = chunkLyrics(lyrics);
			const paginatedMessage = new PaginatedMessage();

			for (const chunk of chunks) {
				paginatedMessage.addPageEmbed((embed) =>
					embed
						.setColor(BRAND_COLOR)
						.setAuthor({ name: song.artist.name, url: song.artist.url })
						.setTitle(song.title)
						.setURL(song.url)
						.setThumbnail(song.thumbnail)
						.setDescription(chunk)
						.setFooter({ text: `Page ${chunks.indexOf(chunk) + 1} of ${chunks.length} • Powered by Genius` })
				);
			}

			return paginatedMessage.run(interaction);
		} catch (error: unknown) {
			this.container.logger.error(error);
			return interaction.editReply({ content: `${emojis.error} | Failed to fetch lyrics — please try again` });
		}
	}
}
