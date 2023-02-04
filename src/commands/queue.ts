import { ApplyOptions } from '@sapphire/decorators';
import { PaginatedMessage } from '@sapphire/discord.js-utilities';
import { Command } from '@sapphire/framework';

@ApplyOptions<Command.Options>({
	description: 'Displays the queue'
})
export class QueueCommand extends Command {
	public override registerApplicationCommands(registry: Command.Registry) {
		registry.registerChatInputCommand((builder) => {
			builder //
				.setName(this.name)
				.setDescription(this.description);
		});
	}

	public override async chatInputRun(interaction: Command.ChatInputCommandInteraction) {
		const queue = this.container.client.player.getQueue(interaction.guild!);

		if (!queue) return interaction.reply({ content: `${this.container.client.dev.error} | I am not in a voice channel`, ephemeral: true });
		if (!queue.tracks || !queue.current)
			return interaction.reply({ content: `${this.container.client.dev.error} | There is no queue`, ephemeral: true });

		await interaction.deferReply();

		const { title, url } = queue.current;
		let pagesNum = Math.ceil(queue.tracks.length / 5);

		if (pagesNum === 0) {
			pagesNum = 1;
		}

		const tracks: any = [];
		for (let i = 0; i < queue.tracks.length; i++) {
			const song = queue.tracks[i];
			tracks.push(
				`**${i + 1})** [${song.title}](${song.url})
			  `
			);
		}

		const paginatedMessage = new PaginatedMessage();

		for (let i = 0; i < pagesNum; i++) {
			const str = tracks.slice(i * 5, i * 5 + 5).join('');

			paginatedMessage.addPageEmbed((embed) =>
				embed
					.setAuthor({
						name: `Queue for ${interaction.guild!.name}`,
						iconURL: interaction.guild?.iconURL()?.toString()
					})
					.setColor('Red')
					.setDescription(`**Now Playing:** [${title}](${url})\n\n**Queue:** ${str === '' ? '*No more queued songs*' : `\n${str}`}`)
					.setFooter({
						text: `${queue.tracks.length} song(s) in queue`
					})
			);
		}

		return paginatedMessage.run(interaction);
	}
}
