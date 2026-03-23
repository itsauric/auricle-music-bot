import { Command } from '@sapphire/framework';
import { useQueue } from 'discord-player';
import { MessageFlags } from 'discord.js';
import { makeEmbed } from '#lib/utils';

function parseTimeInput(input: string): number | null {
	const parts = input.split(':').map(Number);
	if (parts.some(isNaN)) return null;

	if (parts.length === 1) return parts[0] * 1000;

	if (parts.length === 2) {
		const [min, sec] = parts;
		if (sec >= 60) return null;
		return (min * 60 + sec) * 1000;
	}

	if (parts.length === 3) {
		const [hr, min, sec] = parts;
		if (min >= 60 || sec >= 60) return null;
		return (hr * 3600 + min * 60 + sec) * 1000;
	}

	return null;
}

function formatMs(ms: number): string {
	const totalSec = Math.floor(ms / 1000);
	const h = Math.floor(totalSec / 3600);
	const m = Math.floor((totalSec % 3600) / 60);
	const s = totalSec % 60;
	if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
	return `${m}:${String(s).padStart(2, '0')}`;
}

export class SeekCommand extends Command {
	public constructor(context: Command.LoaderContext, options: Command.Options) {
		super(context, {
			...options,
			description: 'Seeks to a position in the current track'
		});
	}

	public override registerApplicationCommands(registry: Command.Registry) {
		registry.registerChatInputCommand((builder) => {
			builder //
				.setName(this.name)
				.setDescription(this.description)
				.addStringOption((option) =>
					option
						.setName('position')
						.setDescription('Position to seek to (e.g. 1:30, 90, 1:30:00)')
						.setRequired(true)
				);
		});
	}

	public override async chatInputRun(interaction: Command.ChatInputCommandInteraction) {
		const { emojis, voice } = this.container.client.utils;
		const queue = useQueue(interaction.guild!.id);
		const permissions = voice(interaction);
		const input = interaction.options.getString('position', true);

		if (!queue) return interaction.reply({ embeds: [makeEmbed(`${emojis.error} | I am **not** in a voice channel`)], flags: MessageFlags.Ephemeral });
		if (!queue.currentTrack)
			return interaction.reply({ embeds: [makeEmbed(`${emojis.error} | There is no track **currently** playing`)], flags: MessageFlags.Ephemeral });
		if (!queue.currentTrack.durationMS)
			return interaction.reply({ embeds: [makeEmbed(`${emojis.error} | Cannot seek on a **live stream**`)], flags: MessageFlags.Ephemeral });
		if (permissions.clientToMember) return interaction.reply({ embeds: [makeEmbed(permissions.clientToMember)], flags: MessageFlags.Ephemeral });

		const ms = parseTimeInput(input);
		if (ms === null)
			return interaction.reply({
				embeds: [makeEmbed(`${emojis.error} | Invalid time format. Use \`mm:ss\`, \`hh:mm:ss\` or raw seconds`)],
				flags: MessageFlags.Ephemeral
			});

		if (ms >= queue.currentTrack.durationMS)
			return interaction.reply({
				embeds: [makeEmbed(`${emojis.error} | Position exceeds the track duration (**${queue.currentTrack.duration}**)`)],
				flags: MessageFlags.Ephemeral
			});

		await queue.node.seek(ms);
		return interaction.reply({ embeds: [makeEmbed(`${emojis.seek} | Seeked to **${formatMs(ms)}**`)] });
	}
}
