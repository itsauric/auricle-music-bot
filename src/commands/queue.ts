import { ApplyOptions } from '@sapphire/decorators';
import { PaginatedMessage } from '@sapphire/discord.js-utilities';
import { Command } from '@sapphire/framework';
import { EmbedBuilder } from 'discord.js';

@ApplyOptions<Command.Options>({
	description: 'Displays the queue'
})
export class QueueCommand extends Command {
	public override registerApplicationCommands(registry: Command.Registry) {
		registry.registerChatInputCommand(
			(builder) => {
				builder //
					.setName(this.name)
					.setDescription(this.description);
			},
			{ idHints: ['517993587989950494'] }
		);
	}

	public override async chatInputRun(interaction: Command.ChatInputCommandInteraction) {
		// Disclaimer: this command is not working as intended - edits may be made in the future

		const queue = this.container.client.player.getQueue(interaction.guild!);

		if (!queue) return interaction.reply({ content: `${this.container.client.dev.error} | I am not in a voice channel`, ephemeral: true });
		if (!queue.tracks || !queue.current)
			return interaction.reply({ content: `${this.container.client.dev.error} | There is no queue`, ephemeral: true });

		await interaction.deferReply();

		const { title, url } = queue.current;
		let pagesNum = Math.ceil(queue.tracks.length / 5);
		if (pagesNum === 0) pagesNum = 1;

		const tracks: any = [];
		for (let i = 0; i < queue.tracks.length; i++) {
			const song = queue.tracks[i];
			tracks.push(
				`**${i + 1})** [${song.title}](${song.url})
				`
			);
		}

		const pages: any = [];
		for (let i = 0; i < pagesNum; i++) {
			const str = tracks.slice(i * 5, i * 5 + 5).join('');
			const embed = new EmbedBuilder()
				.setAuthor({
					name: `Queue for ${interaction.guild!.name}`,
					iconURL: interaction.guild?.iconURL()?.toString()
				})
				.setColor('Red')
				.setDescription(`**Now Playing:** [${title}](${url})\n\n**Queue:** ${str === '' ? '*No more queued songs*' : `\n${str}`}`)
				.setFooter({
					text: `${queue.tracks.length} song(s) in queue`
				});

			pages.push(embed);
		}

		const paginatedMessage = new PaginatedMessage().addPageEmbed(pages[0]);
		if (pagesNum > 1) paginatedMessage.addPageBuilder((builder) => builder.setEmbeds(pages));

		await paginatedMessage.run(interaction, interaction.user);
		return interaction;
	}
}
