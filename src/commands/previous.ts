import { Command } from '@sapphire/framework';
import { EmbedBuilder, GuildMember } from 'discord.js';

export class PreviousCommand extends Command {
	public constructor(context: Command.Context, options: Command.Options) {
		super(context, {
			...options,
			description: 'Plays the previous track'
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
		if (interaction.member instanceof GuildMember) {
			const queue = this.container.client.player.nodes.get(interaction.guild!.id);
			const permissions = this.container.client.perms.voice(interaction, this.container.client);
			if (permissions.member()) return interaction.reply({ content: permissions.member(), ephemeral: true });
			if (permissions.client()) return interaction.reply({ content: permissions.client(), ephemeral: true });

			if (!queue) return interaction.reply({ content: `${this.container.client.dev.error} | I am not in a voice channel`, ephemeral: true });
			if (permissions.clientToMember()) return interaction.reply({ content: permissions.clientToMember(), ephemeral: true });

			if (!queue.history.previousTrack)
				return interaction.reply({
					content: `${this.container.client.dev.error} | There isn't a previous track in the **history**`,
					ephemeral: true
				});

			await interaction.deferReply();

			await queue.history.previous();
			const track = queue.history.previousTrack;
			// const ts = queue.node.getTimestamp();

			console.log(track);

			const embed = new EmbedBuilder()
				.setAuthor({
					name: (track.requestedBy ?? interaction.user).username,
					iconURL: (track.requestedBy ?? interaction.user).displayAvatarURL()
				})
				.setColor('Red')
				.setTitle('💿 Now Playing')
				.setDescription(`[${track.title}](${track.url})`)
				.setThumbnail(track.thumbnail ?? interaction.user.displayAvatarURL())
				.addFields([
					{ name: 'Author', value: track.author }
					// { name: 'Progress', value: `${queue.node.createProgressBar()} (${ts?.progress}%)` }
				])
				.setFooter({
					text: `Ping: ${queue.ping}ms | Event Loop Lag: ${queue.player.eventLoopLag.toFixed(0)}ms`
				});

			return interaction.followUp({ embeds: [embed] });
		}
	}
}
