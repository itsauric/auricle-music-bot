import type { Command } from '@sapphire/framework';
import { useQueue } from 'discord-player';

export async function queueTrackAutocomplete(interaction: Command.AutocompleteInteraction): Promise<void> {
	try {
		const queue = useQueue(interaction.guild!.id);
		if (!queue?.tracks.size) return interaction.respond([]);

		const input = interaction.options.getInteger('track') ?? 0;
		const tracks = queue.tracks.map((t, idx) => ({
			name: t.title.slice(0, 100),
			value: idx + 1
		}));

		const start = Math.max(0, input - 1);
		await interaction.respond(tracks.slice(start, start + 5));
	} catch {
		interaction.respond([]).catch(() => null);
	}
}
