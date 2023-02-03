import { ApplyOptions } from '@sapphire/decorators';
import { Command } from '@sapphire/framework';
import { EmbedBuilder } from 'discord.js';

@ApplyOptions<Command.Options>({
	description: 'Displays the now playing song'
})
export class NowPlayingCommand extends Command {
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
		if (!queue.current)
			return interaction.reply({ content: `${this.container.client.dev.error} | There is no song currently playing`, ephemeral: true });

		await interaction.deferReply();
		const track = queue.current;

		const embed = new EmbedBuilder()
			.setAuthor({
				name: 'Now Playing',
				iconURL: interaction.user.displayAvatarURL()
			})
			.setColor('Red')
			.setDescription(`[${track.title}](${track.url})`)
			.addFields([
				{ name: 'Duration', value: `${track.duration}`, inline: true },
				{ name: 'Requested By', value: `${track.requestedBy?.username}`, inline: true },
				{ name: 'By', value: `${track.author}`, inline: true }
			]);

		return interaction.followUp({ embeds: [embed] });
	}
}
