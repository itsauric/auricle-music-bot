import { PaginatedMessage } from '@sapphire/discord.js-utilities';
import { Command } from '@sapphire/framework';

export class HistoryCommand extends Command {
	public constructor(context: Command.Context, options: Command.Options) {
		super(context, {
			...options,
			description: 'Displays the queue history in an embed'
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
		const queue = this.container.client.player.nodes.get(interaction.guild!.id);

		if (!queue) return interaction.reply({ content: `${this.container.client.dev.error} | I am not in a voice channel`, ephemeral: true });
		if (!queue.history.tracks)
			return interaction.reply({ content: `${this.container.client.dev.error} | There is no queue history`, ephemeral: true });

		await interaction.deferReply();

		let pagesNum = Math.ceil(queue.tracks.size / 5);

		if (pagesNum <= 0) {
			pagesNum = 1;
		}

		const tracks = queue.history.tracks.map((track, idx) => `**${++idx})** [${track.title}](${track.url})`);

		const paginatedMessage = new PaginatedMessage();

		// handle error if pages exceed 25 pages
		if (pagesNum > 25) pagesNum = 25;

		for (let i = 0; i < pagesNum; i++) {
			const list = tracks.slice(i * 5, i * 5 + 5).join('\n');

			paginatedMessage.addPageEmbed((embed) =>
				embed
					.setColor('Red')
					.setDescription(
						`**Queue history** for **session** in **${queue.channel?.name}:**\n${
							list === '' ? '\n*• No more queued tracks*' : `\n${list}`
						}
						\n`
					)
					.setFooter({
						text: `${queue.tracks.size} track(s) in queue`
					})
			);
		}

		return paginatedMessage.run(interaction);
	}
}
