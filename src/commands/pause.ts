import { Command } from '@sapphire/framework';
import { MessageFlags } from 'discord.js';
import { useQueue, useTimeline } from 'discord-player';

export class PauseCommand extends Command {
	public constructor(context: Command.LoaderContext, options: Command.Options) {
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
		const { emojis, voice } = this.container.client.utils;
		const queue = useQueue(interaction.guild!.id);
		const timeline = useTimeline({ node: interaction.guild!.id })!;
		const permissions = voice(interaction);

		if (!queue) return interaction.reply({ content: `${emojis.error} | I am **not** in a voice channel`, flags: MessageFlags.Ephemeral });
		if (!queue.currentTrack)
			return interaction.reply({
				content: `${emojis.error} | There is no track **currently** playing`,
				flags: MessageFlags.Ephemeral
			});
		if (permissions.clientToMember) return interaction.reply({ content: permissions.clientToMember, flags: MessageFlags.Ephemeral });

		timeline.paused ? timeline.resume() : timeline.pause();
		const state = timeline.paused;
		return interaction.reply({
			content: `${emojis.success} | **Playback** has been **${state ? 'paused' : 'resumed'}**`
		});
	}
}
