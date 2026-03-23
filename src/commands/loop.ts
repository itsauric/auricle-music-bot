import { Command } from '@sapphire/framework';
import { MessageFlags } from 'discord.js';
import { QueueRepeatMode, useQueue } from 'discord-player';
import { makeEmbed } from '#lib/utils';

const repeatModes = [
	{ name: 'Off', value: QueueRepeatMode.OFF },
	{ name: 'Track', value: QueueRepeatMode.TRACK },
	{ name: 'Queue', value: QueueRepeatMode.QUEUE },
	{ name: 'Autoplay', value: QueueRepeatMode.AUTOPLAY }
];

export class LoopCommand extends Command {
	public constructor(context: Command.LoaderContext, options: Command.Options) {
		super(context, {
			...options,
			description: 'Loops the current playing track or the entire queue'
		});
	}

	public override registerApplicationCommands(registry: Command.Registry) {
		registry.registerChatInputCommand((builder) => {
			builder //
				.setName(this.name)
				.setDescription(this.description)
				.addNumberOption((option) =>
					option
						.setName('mode')
						.setDescription('Choose a loop mode')
						.setRequired(true)
						.addChoices(...repeatModes)
				);
		});
	}

	public override async chatInputRun(interaction: Command.ChatInputCommandInteraction) {
		const { emojis, voice } = this.container.client.utils;
		const queue = useQueue(interaction.guild!.id);
		const permissions = voice(interaction);

		if (!queue) return interaction.reply({ embeds: [makeEmbed(`${emojis.error} | I am **not** in a voice channel`)], flags: MessageFlags.Ephemeral });
		if (!queue.currentTrack)
			return interaction.reply({
				embeds: [makeEmbed(`${emojis.error} | There is no track **currently** playing`)],
				flags: MessageFlags.Ephemeral
			});
		if (permissions.clientToMember) return interaction.reply({ embeds: [makeEmbed(permissions.clientToMember)], flags: MessageFlags.Ephemeral });

		const mode = interaction.options.getNumber('mode', true) as QueueRepeatMode;
		const name = repeatModes.find((m) => m.value === mode)?.name ?? 'Loop';
		const toggle = mode !== QueueRepeatMode.OFF && queue.repeatMode === mode;

		queue.setRepeatMode(toggle ? QueueRepeatMode.OFF : mode);
		const enabled = !toggle && mode !== QueueRepeatMode.OFF;

		return interaction.reply({
			embeds: [makeEmbed(`${emojis.loop} | **${name}** mode has been **${enabled ? 'enabled' : 'disabled'}**`)]
		});
	}
}
