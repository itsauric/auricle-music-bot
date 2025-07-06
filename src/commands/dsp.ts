import { Command } from '@sapphire/framework';
import { MessageFlags } from 'discord.js';
import { PCMAudioFilters, PCMFilters, useQueue } from 'discord-player';

export class PulsatorCommand extends Command {
	public constructor(context: Command.LoaderContext, options: Command.Options) {
		super(context, {
			...options,
			description: 'The DSP filters that can be applied to tracks'
		});
	}

	public override registerApplicationCommands(registry: Command.Registry) {
		registry.registerChatInputCommand((builder) => {
			builder //
				.setName(this.name)
				.setDescription(this.description)
				.addStringOption((option) =>
					option
						.setName('filter')
						.setDescription('The filter to toggle')
						.addChoices(
							...Object.keys(PCMAudioFilters).map((m) => ({
								name: m,
								value: m
							}))
						)
						.setRequired(true)
				);
		});
	}

	public override async chatInputRun(interaction: Command.ChatInputCommandInteraction) {
		const { emojis, voice } = this.container.client.utils;
		const queue = useQueue(interaction.guild!.id);
		const permissions = voice(interaction);
		const filter = interaction.options.getString('filter') as PCMFilters;

		if (!queue) return interaction.reply({ content: `${emojis.error} | I am **not** in a voice channel`, flags: MessageFlags.Ephemeral });
		if (!queue.currentTrack)
			return interaction.reply({
				content: `${emojis.error} | There is no track **currently** playing`,
				flags: MessageFlags.Ephemeral
			});
		if (permissions.clientToMember) return interaction.reply({ content: permissions.clientToMember, flags: MessageFlags.Ephemeral });

		if (!queue.filters.filters)
			return interaction.reply({
				content: `${emojis.error} | The DSP filters are **not available** to be used in this queue`,
				flags: MessageFlags.Ephemeral
			});

		let ff = queue.filters.filters.filters;
		if (ff.includes(filter)) {
			ff = ff.filter((r) => r !== filter);
		} else {
			ff.push(filter);
		}

		queue.filters.filters.setFilters(ff);

		return interaction.reply({
			content: `${emojis.success} | **${filter}** filter has been **${ff.includes(filter) ? 'enabled' : 'disabled'}**`
		});
	}
}
