import { Command } from '@sapphire/framework';
import { MessageFlags } from 'discord.js';
import { useQueue, useTimeline } from 'discord-player';

export class VolumeCommand extends Command {
	public constructor(context: Command.LoaderContext, options: Command.Options) {
		super(context, {
			...options,
			description: 'Changes the volume of the track and entire queue'
		});
	}

	public override registerApplicationCommands(registry: Command.Registry) {
		registry.registerChatInputCommand((builder) => {
			builder //
				.setName(this.name)
				.setDescription(this.description)
				.addIntegerOption((option) =>
					option.setName('amount').setDescription('The amount of volume you want to change to').setMinValue(0).setMaxValue(100)
				);
		});
	}

	public override async chatInputRun(interaction: Command.ChatInputCommandInteraction) {
		const { emojis, voice } = this.container.client.utils;
		const queue = useQueue(interaction.guild!.id);
		const timeline = useTimeline({ node: interaction.guild!.id })!;
		const permissions = voice(interaction);
		const volume = interaction.options.getInteger('amount');

		if (!queue) return interaction.reply({ content: `${emojis.error} | I am not in a voice channel`, flags: MessageFlags.Ephemeral });
		if (!queue.currentTrack)
			return interaction.reply({
				content: `${emojis.error} | There is no track **currently** playing`,
				flags: MessageFlags.Ephemeral
			});

		if (!volume) return interaction.reply({ content: `🔊 | **Current** volume is **${timeline.volume}%**` });
		if (permissions.clientToMember) return interaction.reply({ content: permissions.clientToMember, flags: MessageFlags.Ephemeral });

		timeline.setVolume(volume!);
		return interaction.reply({
			content: `${emojis.success} | I **changed** the volume to: **${timeline.volume}%**`
		});
	}
}
