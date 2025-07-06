import { Command } from '@sapphire/framework';
import { MessageFlags } from 'discord.js';

export class LyricsCommand extends Command {
	public constructor(context: Command.LoaderContext, options: Command.Options) {
		super(context, {
			...options,
			description: 'Displays lyrics of the given track'
		});
	}

	public override registerApplicationCommands(registry: Command.Registry) {
		registry.registerChatInputCommand((builder) => {
			builder //
				.setName(this.name)
				.setDescription(this.description)
				.addBooleanOption((option) => {
					return option.setName('synced').setDescription('Sync the lyrics to the current track');
				});
		});
	}

	public override async chatInputRun(interaction: Command.ChatInputCommandInteraction) {
		// const { emojis } = this.container.client.utils;
		// const queue = useQueue(interaction.guild!.id);
		// const track = interaction.options.getString('track') || (queue?.currentTrack?.title as string);
		// const lyrics = await genius.search(track).catch(() => null);
		// if (!lyrics)
		// 	return interaction.reply({
		// 		content: `${emojis.error} | There are **no** lyrics for this track`,
		// 		flags: MessageFlags.Ephemeral
		// 	});
		// const trimmedLyrics = lyrics.lyrics.substring(0, 1997);
		// const embed = new EmbedBuilder()
		// 	.setTitle(lyrics.title)
		// 	.setURL(lyrics.url)
		// 	.setThumbnail(lyrics.thumbnail)
		// 	.setAuthor({
		// 		name: lyrics.artist.name,
		// 		iconURL: lyrics.artist.image,
		// 		url: lyrics.artist.url
		// 	})
		// 	.setDescription(trimmedLyrics.length === 1997 ? `${trimmedLyrics}...` : trimmedLyrics)
		// 	.setColor('Yellow');
		// return interaction.reply({ embeds: [embed] });
	}
}
