import { Command } from '@sapphire/framework';
import { QueryType, useMainPlayer, useQueue } from 'discord-player';

import { ActionRowBuilder, ComponentType, MessageFlags, StringSelectMenuBuilder } from 'discord.js';
import type { GuildMember } from 'discord.js';
import { makeEmbed } from '#lib/utils';

export class SearchCommand extends Command {
	public constructor(context: Command.LoaderContext, options: Command.Options) {
		super(context, {
			...options,
			description: 'Search for tracks and pick one to play from a list'
		});
	}

	public override registerApplicationCommands(registry: Command.Registry) {
		registry.registerChatInputCommand((builder) => {
			builder //
				.setName(this.name)
				.setDescription(this.description)
				.addStringOption((option) => option.setName('query').setDescription('Search query').setRequired(true));
		});
	}

	public override async chatInputRun(interaction: Command.ChatInputCommandInteraction) {
		const { emojis, voice, options } = this.container.client.utils;
		const player = useMainPlayer()!;
		const permissions = voice(interaction);
		const query = interaction.options.getString('query', true);
		const member = interaction.member as GuildMember;

		if (permissions.member) return interaction.reply({ embeds: [makeEmbed(permissions.member)], flags: MessageFlags.Ephemeral });
		if (permissions.client) return interaction.reply({ embeds: [makeEmbed(permissions.client)], flags: MessageFlags.Ephemeral });
		if (permissions.clientToMember) return interaction.reply({ embeds: [makeEmbed(permissions.clientToMember)], flags: MessageFlags.Ephemeral });

		await interaction.deferReply({ flags: MessageFlags.Ephemeral });

		const searchEngine = query.startsWith('http') ? undefined : QueryType.SOUNDCLOUD_SEARCH;
		let results;
		try {
			results = await player.search(query, { searchEngine });
		} catch {
			return interaction.editReply({ embeds: [makeEmbed(`${emojis.error} | Search failed — please try again`)] });
		}
		if (!results.hasTracks())
			return interaction.editReply({ embeds: [makeEmbed(`${emojis.error} | **No** tracks were found for your query`)] });

		const tracks = results.tracks.slice(0, 5);
		const menu = new StringSelectMenuBuilder()
			.setCustomId('search_select')
			.setPlaceholder('Select a track to play...')
			.addOptions(
				tracks.map((t, i) => ({
					label: t.title.slice(0, 100),
					description: `${t.author} • ${t.duration}`.slice(0, 100),
					value: String(i)
				}))
			);

		const row = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(menu);
		const reply = await interaction.editReply({ embeds: [makeEmbed(`${emojis.search} | Select a track to play:`)], components: [row] });

		const collector = reply.createMessageComponentCollector({
			componentType: ComponentType.StringSelect,
			time: 60_000,
			max: 1,
			filter: (i) => i.user.id === interaction.user.id
		});

		collector.on('collect', async (i) => {
			const track = tracks[parseInt(i.values[0])];
			try {
				const hadTrack = !!useQueue(interaction.guild!.id)?.currentTrack;
				const res = await player.play(member.voice.channel!.id, track, {
					requestedBy: interaction.user,
					nodeOptions: options(interaction)
				});
				const isNowPlaying = !hadTrack || useQueue(interaction.guild!.id)?.currentTrack?.url === res.track.url;
				await i.update({
					embeds: [
						makeEmbed(
							isNowPlaying
								? `${emojis.play} | Now playing: **${res.track.title}**`
								: `${emojis.enqueue} | Added **${res.track.title}** to the queue`
						)
					],
					components: []
				});
			} catch (error: unknown) {
				await i.update({ embeds: [makeEmbed(`${emojis.error} | An **error** has occurred`)], components: [] });
				this.container.logger.error(error);
			}
		});

		collector.on('end', (collected) => {
			if (!collected.size) {
				interaction
					.editReply({ embeds: [makeEmbed(`${emojis.warning} | Search timed out — use \`/search\` to try again`)], components: [] })
					.catch(() => null);
			}
		});
	}
}
