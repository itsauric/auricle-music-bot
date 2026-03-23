import { Command } from '@sapphire/framework';
import { QueryType, useMainPlayer, useQueue } from 'discord-player';
import { MessageFlags } from 'discord.js';
import type { GuildMember } from 'discord.js';
import { makeEmbed } from '#lib/utils';

export class PlayCommand extends Command {
	public constructor(context: Command.LoaderContext, options: Command.Options) {
		super(context, {
			...options,
			description: 'Plays and enqueues track(s) of the query provided'
		});
	}

	public override registerApplicationCommands(registry: Command.Registry) {
		registry.registerChatInputCommand((builder) => {
			builder //
				.setName(this.name)
				.setDescription(this.description)
				.addStringOption((option) => {
					return option.setName('query').setDescription('A query of your choice').setRequired(true).setAutocomplete(true);
				});
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
		const query = interaction.options.getString('query')!;
		const member = interaction.member as GuildMember;

		if (permissions.member) return interaction.reply({ embeds: [makeEmbed(permissions.member)], flags: MessageFlags.Ephemeral });
		if (permissions.client) return interaction.reply({ embeds: [makeEmbed(permissions.client)], flags: MessageFlags.Ephemeral });
		if (permissions.clientToMember) return interaction.reply({ embeds: [makeEmbed(permissions.clientToMember)], flags: MessageFlags.Ephemeral });

		const searchEngine = query.startsWith('http') ? undefined : QueryType.YOUTUBE_SEARCH;
		const results = await player.search(query, { searchEngine });
		if (!results.hasTracks())
			return interaction.reply({
				embeds: [makeEmbed(`${emojis.error} | **No** tracks were found for your query`)],
				flags: MessageFlags.Ephemeral
			});

		await interaction.deferReply();

		try {
			const hadTrack = !!useQueue(interaction.guild!.id)?.currentTrack;
			const res = await player.play(member.voice.channel!.id, results, { requestedBy: interaction.user, nodeOptions: options(interaction) });
			const finalQueue = useQueue(interaction.guild!.id);
			let description: string;
			if (res.track.playlist) {
				description = `${emojis.enqueue} | Added tracks from **${res.track.playlist.title}** to the queue`;
			} else if (!hadTrack || finalQueue?.currentTrack?.url === res.track.url) {
				description = `${emojis.play} | Now playing: **${res.track.title}**`;
			} else {
				const position = finalQueue?.tracks.size ?? 1;
				description = `${emojis.enqueue} | Added **${res.track.title}** to the queue at position **#${position}**`;
			}
			return interaction.editReply({ embeds: [makeEmbed(description)] });
		} catch (error: unknown) {
			await interaction.editReply({ embeds: [makeEmbed(`${emojis.error} | An **error** has occurred`)] });
			this.container.logger.error(error);
		}
	}
}
