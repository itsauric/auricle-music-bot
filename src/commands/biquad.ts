import { Command } from '@sapphire/framework';
import { BiquadFilterType, useQueue } from 'discord-player';
import { MessageFlags } from 'discord.js';
import type { APIApplicationCommandOptionChoice } from 'discord.js';

type SupportedBiquadFilters = keyof typeof BiquadFilterType | 'Off';

export class BiquadCommand extends Command {
	public constructor(context: Command.LoaderContext, options: Command.Options) {
		super(context, {
			...options,
			description: 'The biquad filter that can be applied to tracks'
		});
	}

	public override registerApplicationCommands(registry: Command.Registry) {
		const biquadFilters = Object.keys(BiquadFilterType)
			.filter((k) => typeof k[0] === 'string')
			.map((m) => ({
				name: m,
				value: m
			})) as APIApplicationCommandOptionChoice<SupportedBiquadFilters>[];

		biquadFilters.unshift({
			name: 'Disable',
			value: 'Off'
		});

		registry.registerChatInputCommand((builder) => {
			builder //
				.setName(this.name)
				.setDescription(this.description)
				.addStringOption((option) =>
					option
						.setName('filter')
						.setDescription('The biquad filter to use')
						.addChoices(...biquadFilters)
						.setRequired(true)
				)
				.addNumberOption((option) => {
					return option.setMinValue(-50).setMaxValue(50).setName('gain').setDescription('The dB gain value').setRequired(false);
				});
		});
	}

	public override async chatInputRun(interaction: Command.ChatInputCommandInteraction) {
		const { emojis, voice } = this.container.client.utils;
		const queue = useQueue(interaction.guild!.id);
		const permissions = voice(interaction);

		const filter = interaction.options.getString('filter', true) as SupportedBiquadFilters;
		const dB = interaction.options.getNumber('gain');

		if (!queue) return interaction.reply({ content: `${emojis.error} | I am **not** in a voice channel`, flags: MessageFlags.Ephemeral });
		if (!queue.currentTrack)
			return interaction.reply({
				content: `${emojis.error} | There is no track **currently** playing`,
				flags: MessageFlags.Ephemeral
			});
		if (permissions.clientToMember) return interaction.reply({ content: permissions.clientToMember, flags: MessageFlags.Ephemeral });

		if (!queue.filters.biquad)
			return interaction.reply({
				content: `${emojis.error} | The biquad filter is **not available** to be used in this queue`,
				flags: MessageFlags.Ephemeral
			});

		if (filter === 'Off') {
			queue.filters.biquad.disable();
		} else {
			if (typeof dB === 'number') queue.filters.biquad.setGain(dB);
			queue.filters.biquad.enable();
			queue.filters.biquad.setFilter(BiquadFilterType[filter]);
		}

		return interaction.reply({
			content: `${emojis.success} | **Biquad filter** set to: \`${filter}\``
		});
	}
}
