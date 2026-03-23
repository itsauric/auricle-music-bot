import { PaginatedMessage } from '@sapphire/discord.js-utilities';
import { Command } from '@sapphire/framework';
import { MessageFlags } from 'discord.js';
import { useQueue } from 'discord-player';
import { BRAND_COLOR, makeEmbed } from '#lib/utils';

function formatTotalMs(ms: number): string {
	const h = Math.floor(ms / 3_600_000);
	const m = Math.floor((ms % 3_600_000) / 60_000);
	if (h > 0) return `${h}h ${m}m`;
	return `${m}m`;
}

export class QueueCommand extends Command {
	public constructor(context: Command.LoaderContext, options: Command.Options) {
		super(context, {
			...options,
			description: 'Displays the queue in an embed'
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
		const { emojis } = this.container.client.utils;
		const queue = useQueue(interaction.guild!.id);

		if (!queue) return interaction.reply({ embeds: [makeEmbed(`${emojis.error} | I am **not** in a voice channel`)], flags: MessageFlags.Ephemeral });
		if (!queue.currentTrack)
			return interaction.reply({
				embeds: [makeEmbed(`${emojis.error} | There is **no** queue to **display**`)],
				flags: MessageFlags.Ephemeral
			});

		let pagesNum = queue.tracks.size > 0 ? Math.min(Math.ceil(queue.tracks.size / 5), 25) : 1;

		const tracks = queue.tracks.map((track, idx) => {
			const num = String(++idx).padStart(2, '0');
			const title = track.title.length > 45 ? `${track.title.slice(0, 45)}…` : track.title;
			return `\`${num}\` [${title}](${track.url}) — \`${track.duration}\``;
		});

		const currentTrack = queue.currentTrack;
		const totalMs = queue.tracks.toArray().reduce((sum, t) => sum + (t.durationMS ?? 0), 0);
		const paginatedMessage = new PaginatedMessage();

		for (let i = 0; i < pagesNum; i++) {
			const list = tracks.slice(i * 5, i * 5 + 5).join('\n');

			paginatedMessage.addPageEmbed((embed) =>
				embed
					.setColor(BRAND_COLOR)
					.setAuthor({
						name: `Queue — ${queue.channel?.name ?? interaction.guild!.name}`,
						iconURL: interaction.guild!.iconURL() ?? undefined
					})
					.setTitle('📋 Server Queue')
					.setDescription(
						`**▶ Now Playing**\n[${currentTrack.title.slice(0, 60)}](${currentTrack.url})\n\n` +
							(list ? `**Up Next**\n${list}` : '*No more tracks in queue*')
					)
					.setThumbnail(currentTrack.thumbnail ?? null)
					.setFooter({ text: `${queue.tracks.size} track${queue.tracks.size === 1 ? '' : 's'} in queue${totalMs > 0 ? `  •  ${formatTotalMs(totalMs)} total` : ''}  •  Page ${i + 1}/${pagesNum}` })
			);
		}

		return paginatedMessage.run(interaction);
	}
}
