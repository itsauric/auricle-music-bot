import { PaginatedMessage } from '@sapphire/discord.js-utilities';
import { Command } from '@sapphire/framework';
import { useMainPlayer, useQueue } from 'discord-player';
import { MessageFlags } from 'discord.js';
import { BRAND_COLOR, makeEmbed } from '#lib/utils';

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
		const currentTrack = queue?.currentTrack;
		const searchQuery = trackInput ?? currentTrack?.title;

		if (!searchQuery)
			return interaction.reply({
				embeds: [makeEmbed(`${emojis.error} | Provide a track name or start playing something first`)],
				flags: MessageFlags.Ephemeral
			});

		await interaction.deferReply();

		const player = useMainPlayer();

		try {
			const results = await player.lyrics.search(
				currentTrack && !trackInput
					? { trackName: currentTrack.cleanTitle, artistName: currentTrack.author }
					: { q: searchQuery }
			);

			if (!results.length)
				return interaction.editReply({ embeds: [makeEmbed(`${emojis.error} | No lyrics found for **${searchQuery}**`)] });

			const result = results[0];

			if (!result.plainLyrics?.trim())
				return interaction.editReply({ embeds: [makeEmbed(`${emojis.error} | No lyrics available for **${result.trackName}**`)] });

			const chunks = chunkLyrics(result.plainLyrics);
			const paginatedMessage = new PaginatedMessage();

			for (const chunk of chunks) {
				paginatedMessage.addPageEmbed((embed) =>
					embed
						.setColor(BRAND_COLOR)
						.setAuthor({ name: result.artistName })
						.setTitle(result.trackName)
						.setDescription(chunk)
						.setFooter({ text: `Page ${chunks.indexOf(chunk) + 1} of ${chunks.length}` })
				);
			}

			return paginatedMessage.run(interaction);
		} catch (error: unknown) {
			this.container.logger.error(error);
			return interaction.editReply({ embeds: [makeEmbed(`${emojis.error} | Failed to fetch lyrics - please try again`)] });
		}
	}
}
