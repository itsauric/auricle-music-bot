import { PaginatedMessage } from '@sapphire/discord.js-utilities';
import { Command } from '@sapphire/framework';
import { MessageFlags } from 'discord.js';
import { useHistory, useQueue } from 'discord-player';
import { BRAND_COLOR } from '#lib/utils';

export class HistoryCommand extends Command {
	public constructor(context: Command.LoaderContext, options: Command.Options) {
		super(context, {
			...options,
			description: 'Displays the queue history in an embed'
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
		const history = useHistory(interaction.guild!.id);

		if (!queue) return interaction.reply({ content: `${emojis.error} | I am **not** in a voice channel`, flags: MessageFlags.Ephemeral });
		if (!history?.tracks.size)
			return interaction.reply({
				content: `${emojis.error} | There is **no** queue history to **display**`,
				flags: MessageFlags.Ephemeral
			});

		const pagesNum = Math.min(Math.ceil(history.tracks.size / 5), 25);

		const tracks = history.tracks.map((track, idx) => {
			const num = String(++idx).padStart(2, '0');
			const title = track.title.length > 45 ? `${track.title.slice(0, 45)}…` : track.title;
			return `\`${num}\` [${title}](${track.url}) — \`${track.duration}\``;
		});

		const paginatedMessage = new PaginatedMessage();

		for (let i = 0; i < pagesNum; i++) {
			const list = tracks.slice(i * 5, i * 5 + 5).join('\n');

			paginatedMessage.addPageEmbed((embed) =>
				embed
					.setColor(BRAND_COLOR)
					.setAuthor({
						name: `History — ${queue.channel?.name ?? interaction.guild!.name}`,
						iconURL: interaction.guild!.iconURL() ?? undefined
					})
					.setTitle('📜 Play History')
					.setDescription(list || '*No tracks to show*')
					.setFooter({ text: `${history.tracks.size} track${history.tracks.size === 1 ? '' : 's'} played  •  Page ${i + 1}/${pagesNum}` })
			);
		}

		return paginatedMessage.run(interaction);
	}
}
