import { Subcommand } from '@sapphire/plugin-subcommands';
import { BiquadFilterType, EqualizerConfigurationPreset, FiltersName, PCMAudioFilters, PCMFilters, useQueue } from 'discord-player';
import { MessageFlags } from 'discord.js';
import type { APIApplicationCommandOptionChoice } from 'discord.js';

type SupportedBiquadFilters = keyof typeof BiquadFilterType | 'Off';

export class AudioCommand extends Subcommand {
	public constructor(context: Subcommand.LoaderContext, options: Subcommand.Options) {
		super(context, {
			...options,
			description: 'Manage audio filters and effects for the current track',
			subcommands: [
				{ name: 'filter', chatInputRun: 'chatInputFilter' },
				{ name: 'equaliser', chatInputRun: 'chatInputEqualiser' },
				{ name: 'biquad', chatInputRun: 'chatInputBiquad' },
				{ name: 'effects', chatInputRun: 'chatInputEffects' }
			]
		});
	}

	public override registerApplicationCommands(registry: Subcommand.Registry) {
		const biquadFilters = Object.keys(BiquadFilterType).map((m) => ({
			name: m,
			value: m
		})) as APIApplicationCommandOptionChoice<SupportedBiquadFilters>[];

		biquadFilters.unshift({ name: 'Disable', value: 'Off' });

		registry.registerChatInputCommand((builder) => {
			builder
				.setName(this.name)
				.setDescription(this.description)
				.addSubcommand((sub) =>
					sub
						.setName('filter')
						.setDescription('Toggle an FFmpeg filter on the current track')
						.addStringOption((option) =>
							option
								.setName('filter')
								.setDescription('The FFmpeg filter to use')
								.addChoices(
									{ name: 'Off', value: 'Off' },
									...([
										{ name: 'lofi', value: 'lofi' },
										{ name: '8D', value: '8D' },
										{ name: 'bassboost', value: 'bassboost' },
										{ name: 'compressor', value: 'compressor' },
										{ name: 'karaoke', value: 'karaoke' },
										{ name: 'vibrato', value: 'vibrato' },
										{ name: 'vaporwave', value: 'vaporwave' },
										{ name: 'nightcore', value: 'nightcore' },
										{ name: 'tremolo', value: 'tremolo' }
									] as { name: FiltersName; value: FiltersName }[])
								)
								.setRequired(true)
						)
				)
				.addSubcommand((sub) =>
					sub
						.setName('equaliser')
						.setDescription('Apply an equaliser preset to the current track')
						.addStringOption((option) =>
							option
								.setName('preset')
								.setDescription('The equaliser preset to use')
								.addChoices(
									...Object.keys(EqualizerConfigurationPreset).map((m) => ({
										name: m,
										value: m
									}))
								)
								.setRequired(true)
						)
				)
				.addSubcommand((sub) =>
					sub
						.setName('biquad')
						.setDescription('Apply a biquad filter to the current track')
						.addStringOption((option) =>
							option
								.setName('filter')
								.setDescription('The biquad filter to use')
								.addChoices(...biquadFilters)
								.setRequired(true)
						)
						.addNumberOption((option) =>
							option.setMinValue(-50).setMaxValue(50).setName('gain').setDescription('The dB gain value').setRequired(false)
						)
				)
				.addSubcommand((sub) =>
					sub
						.setName('effects')
						.setDescription('Toggle a PCM audio effect on the current track')
						.addStringOption((option) =>
							option
								.setName('effect')
								.setDescription('The PCM effect to toggle')
								.addChoices(
									...Object.keys(PCMAudioFilters).map((m) => ({
										name: m,
										value: m
									}))
								)
								.setRequired(true)
						)
				);
		});
	}

	public async chatInputFilter(interaction: Subcommand.ChatInputCommandInteraction) {
		const { emojis, voice } = this.container.client.utils;
		const queue = useQueue(interaction.guild!.id);
		const permissions = voice(interaction);
		const filter = interaction.options.getString('filter', true) as FiltersName | 'Off';

		if (!queue) return interaction.reply({ content: `${emojis.error} | I am **not** in a voice channel`, flags: MessageFlags.Ephemeral });
		if (!queue.currentTrack)
			return interaction.reply({ content: `${emojis.error} | There is no track **currently** playing`, flags: MessageFlags.Ephemeral });
		if (permissions.clientToMember) return interaction.reply({ content: permissions.clientToMember, flags: MessageFlags.Ephemeral });

		if (!queue.filters.ffmpeg)
			return interaction.reply({
				content: `${emojis.error} | FFmpeg filters are **not available** in this queue`,
				flags: MessageFlags.Ephemeral
			});

		if (filter === 'Off') {
			await queue.filters.ffmpeg.setFilters(false);
			return interaction.reply({ content: `${emojis.filter} | **Audio** filter has been **disabled**` });
		}

		await queue.filters.ffmpeg.toggle(filter.includes('bassboost') ? ['bassboost', 'normalizer'] : filter);

		return interaction.reply({
			content: `${emojis.filter} | **${filter}** filter has been **${queue.filters.ffmpeg.isEnabled(filter) ? 'enabled' : 'disabled'}**`
		});
	}

	public async chatInputEqualiser(interaction: Subcommand.ChatInputCommandInteraction) {
		const { emojis, voice } = this.container.client.utils;
		const queue = useQueue(interaction.guild!.id);
		const permissions = voice(interaction);
		const preset = interaction.options.getString('preset', true);

		if (!queue) return interaction.reply({ content: `${emojis.error} | I am **not** in a voice channel`, flags: MessageFlags.Ephemeral });
		if (!queue.currentTrack)
			return interaction.reply({ content: `${emojis.error} | There is no track **currently** playing`, flags: MessageFlags.Ephemeral });
		if (permissions.clientToMember) return interaction.reply({ content: permissions.clientToMember, flags: MessageFlags.Ephemeral });

		if (!queue.filters.equalizer)
			return interaction.reply({
				content: `${emojis.error} | The equaliser is **not available** in this queue`,
				flags: MessageFlags.Ephemeral
			});

		queue.filters.equalizer.setEQ(EqualizerConfigurationPreset[preset as keyof typeof EqualizerConfigurationPreset]);
		queue.filters.equalizer.enable();

		return interaction.reply({ content: `${emojis.equaliser} | **Equaliser** set to: **\`${preset}\`**` });
	}

	public async chatInputBiquad(interaction: Subcommand.ChatInputCommandInteraction) {
		const { emojis, voice } = this.container.client.utils;
		const queue = useQueue(interaction.guild!.id);
		const permissions = voice(interaction);
		const filter = interaction.options.getString('filter', true) as SupportedBiquadFilters;
		const dB = interaction.options.getNumber('gain');

		if (!queue) return interaction.reply({ content: `${emojis.error} | I am **not** in a voice channel`, flags: MessageFlags.Ephemeral });
		if (!queue.currentTrack)
			return interaction.reply({ content: `${emojis.error} | There is no track **currently** playing`, flags: MessageFlags.Ephemeral });
		if (permissions.clientToMember) return interaction.reply({ content: permissions.clientToMember, flags: MessageFlags.Ephemeral });

		if (!queue.filters.biquad)
			return interaction.reply({
				content: `${emojis.error} | The biquad filter is **not available** in this queue`,
				flags: MessageFlags.Ephemeral
			});

		if (filter === 'Off') {
			queue.filters.biquad.disable();
		} else {
			if (typeof dB === 'number') queue.filters.biquad.setGain(dB);
			queue.filters.biquad.enable();
			queue.filters.biquad.setFilter(BiquadFilterType[filter]);
		}

		return interaction.reply({ content: `${emojis.filter} | **Biquad filter** set to: \`${filter}\`` });
	}

	public async chatInputEffects(interaction: Subcommand.ChatInputCommandInteraction) {
		const { emojis, voice } = this.container.client.utils;
		const queue = useQueue(interaction.guild!.id);
		const permissions = voice(interaction);
		const effect = interaction.options.getString('effect', true) as PCMFilters;

		if (!queue) return interaction.reply({ content: `${emojis.error} | I am **not** in a voice channel`, flags: MessageFlags.Ephemeral });
		if (!queue.currentTrack)
			return interaction.reply({ content: `${emojis.error} | There is no track **currently** playing`, flags: MessageFlags.Ephemeral });
		if (permissions.clientToMember) return interaction.reply({ content: permissions.clientToMember, flags: MessageFlags.Ephemeral });

		if (!queue.filters.filters)
			return interaction.reply({
				content: `${emojis.error} | PCM effects are **not available** in this queue`,
				flags: MessageFlags.Ephemeral
			});

		let ff = queue.filters.filters.filters;
		if (ff.includes(effect)) {
			ff = ff.filter((r) => r !== effect);
		} else {
			ff.push(effect);
		}

		queue.filters.filters.setFilters(ff);

		return interaction.reply({
			content: `${emojis.filter} | **${effect}** effect has been **${ff.includes(effect) ? 'enabled' : 'disabled'}**`
		});
	}
}
