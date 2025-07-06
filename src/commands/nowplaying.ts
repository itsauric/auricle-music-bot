import { Command } from '@sapphire/framework';
import { useQueue, useTimeline } from 'discord-player';
import { EmbedBuilder, MessageFlags } from 'discord.js';

export class NowPlayingCommand extends Command {
	public constructor(context: Command.LoaderContext, options: Command.Options) {
		super(context, {
			...options,
			description: 'Displays the current track in an embed'
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
		const timeline = useTimeline({ node: interaction.guild!.id })!;

		if (!queue) return interaction.reply({ content: `${emojis.error} | I am **not** in a voice channel`, flags: MessageFlags.Ephemeral });
		if (!queue.currentTrack)
			return interaction.reply({
				content: `${emojis.error} | There is no track **currently** playing`,
				flags: MessageFlags.Ephemeral
			});

		const track = queue.currentTrack;

		const embed = new EmbedBuilder()
			.setAuthor({
				name: interaction.user.username,
				iconURL: interaction.user.displayAvatarURL()
			})
			.setColor('Red')
			.setTitle('💿 Now Playing')
			.setDescription(`[${track.title}](${track.url})`)
			.setThumbnail(track.thumbnail ?? interaction.user.displayAvatarURL())
			.addFields([
				{ name: 'Author', value: track.author },
				{ name: 'Progress', value: `${queue.node.createProgressBar()} (${timeline.timestamp?.progress}%)` },
				{ name: 'Extractor', value: `\`${track.extractor?.identifier || 'N/A'}\`` }
			])
			.setFooter({
				text: `Ping: ${queue.ping}ms | Event Loop Lag: ${queue.player.eventLoopLag.toFixed(0)}ms`
			});

		return interaction.reply({ embeds: [embed] });
	}
}
