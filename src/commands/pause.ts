import { Command } from '@sapphire/framework';
import { useQueue } from 'discord-player';
import { GuildMember } from 'discord.js';

export class PauseCommand extends Command {
	public constructor(context: Command.Context, options: Command.Options) {
		super(context, {
			...options,
			description: 'Pauses or resumes the current track'
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
			const queue = useQueue(interaction.guild!.id);
			const permissions = this.container.client.perms.voice(interaction, this.container.client);

			if (!queue)
				return interaction.reply({ content: `${this.container.client.dev.error} | I am **not** in a voice channel`, ephemeral: true });
			if (permissions.clientToMember()) return interaction.reply({ content: permissions.clientToMember(), ephemeral: true });

			if (!queue.currentTrack)
				return interaction.reply({
					content: `${this.container.client.dev.error} | There is no track **currently** playing`,
					ephemeral: true
				});

			await interaction.deferReply();

			queue.node.setPaused(!queue.node.isPaused());
			const state = queue.node.isPaused();
			return interaction.followUp({
				content: `${this.container.client.dev.success} | **Playback** has been **${state ? 'paused' : 'resumed'}**`
			});
		}
	}
}
