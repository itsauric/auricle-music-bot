import { Command } from '@sapphire/framework';
import { QueryType, useMainPlayer, useQueue } from 'discord-player';
import { MessageFlags } from 'discord.js';
import type { GuildMember } from 'discord.js';

export class PlayNextCommand extends Command {
	public constructor(context: Command.LoaderContext, options: Command.Options) {
		super(context, {
			...options,
			description: 'Plays a track next, inserting it at the front of the queue'
		});
	}

	public override registerApplicationCommands(registry: Command.Registry) {
		registry.registerChatInputCommand((builder) => {
			builder //
				.setName(this.name)
				.setDescription(this.description)
				.addStringOption((option) =>
					option.setName('query').setDescription('A query of your choice').setRequired(true).setAutocomplete(true)
				);
		});
	}

	public override async autocompleteRun(interaction: Command.AutocompleteInteraction) {
		const query = interaction.options.getString('query')?.trim();
		if (!query) return interaction.respond([]);

		try {
			const player = useMainPlayer()!;
			const searchEngine = query.startsWith('http') ? undefined : QueryType.SOUNDCLOUD_SEARCH;
			const results = await player.search(query, { searchEngine });

			let tracks;
			if (results.playlist) {
				tracks = [{ name: `${results.playlist.title} [playlist]`, value: results.playlist.url }];
			} else {
				tracks = results.tracks.map((t) => ({ name: t.title, value: t.url })).slice(0, 5);
			}

			return interaction.respond(tracks).catch(() => null);
		} catch {
			return interaction.respond([]).catch(() => null);
		}
	}

	public override async chatInputRun(interaction: Command.ChatInputCommandInteraction) {
		const { emojis, voice, options } = this.container.client.utils;
		const player = useMainPlayer()!;
		const permissions = voice(interaction);
		const query = interaction.options.getString('query', true);
		const member = interaction.member as GuildMember;

		if (permissions.member) return interaction.reply({ content: permissions.member, flags: MessageFlags.Ephemeral });
		if (permissions.client) return interaction.reply({ content: permissions.client, flags: MessageFlags.Ephemeral });
		if (permissions.clientToMember) return interaction.reply({ content: permissions.clientToMember, flags: MessageFlags.Ephemeral });

		const searchEngine = query.startsWith('http') ? undefined : QueryType.YOUTUBE_SEARCH;
		const results = await player.search(query, { searchEngine });
		if (!results.hasTracks())
			return interaction.reply({
				content: `${emojis.error} | **No** tracks were found for your query`,
				flags: MessageFlags.Ephemeral
			});

		await interaction.deferReply();

		try {
			// Capture queue size before play so we can locate the newly added track by position
			const existingQueue = useQueue(interaction.guild!.id);
			const wasPlaying = existingQueue?.currentTrack != null;
			const sizeBefore = existingQueue?.tracks.size ?? 0;

			const res = await player.play(member.voice.channel!.id, results, {
				requestedBy: interaction.user,
				nodeOptions: options(interaction)
			});

			if (wasPlaying) {
				const queue = useQueue(interaction.guild!.id);
				if (queue && queue.tracks.size > sizeBefore) {
					// Track landed at the end — move it to position 0 (plays next)
					const added = queue.tracks.at(queue.tracks.size - 1);
					if (added) queue.node.move(added, 0);
				}
			}

			return interaction.editReply({
				content: `${emojis.enqueue} | **${res.track.title}** will play **next**`
			});
		} catch (error: unknown) {
			await interaction.editReply({ content: `${emojis.error} | An **error** has occurred` });
			this.container.logger.error(error);
		}
	}
}
