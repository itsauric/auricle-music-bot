import { Command } from '@sapphire/framework';
import { MessageFlags } from 'discord.js';
import { EqualizerConfigurationPreset, useQueue } from 'discord-player';

export class EqualizerCommand extends Command {
	public constructor(context: Command.LoaderContext, options: Command.Options) {
		super(context, {
			...options,
			description: 'The equaliser filter that can be applied to tracks'
		});
	}

	public override registerApplicationCommands(registry: Command.Registry) {
		registry.registerChatInputCommand((builder) => {
			builder //
				.setName(this.name)
				.setDescription(this.description)
				.addStringOption((option) =>
					option
						.setName('preset')
						.setDescription('The equaliser filter to use')
						.addChoices(
							...Object.keys(EqualizerConfigurationPreset).map((m) => ({
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
		const preset = interaction.options.getString('preset') as string;

		if (!queue) return interaction.reply({ content: `${emojis.error} | I am **not** in a voice channel`, flags: MessageFlags.Ephemeral });
		if (!queue.currentTrack)
			return interaction.reply({
				content: `${emojis.error} | There is no track **currently** playing`,
				flags: MessageFlags.Ephemeral
			});
		if (permissions.clientToMember) return interaction.reply({ content: permissions.clientToMember, flags: MessageFlags.Ephemeral });

		if (!queue.filters.equalizer)
			return interaction.reply({
				content: `${emojis.error} | The equaliser filter is **not available** to be used in this queue`,
				flags: MessageFlags.Ephemeral
			});

		queue.filters.equalizer.setEQ(EqualizerConfigurationPreset[preset as keyof typeof EqualizerConfigurationPreset]);
		queue.filters.equalizer.enable();

		return interaction.reply({
			content: `${emojis.success} | **Equaliser** filter has been set to: **\`${preset}\`**`
		});
	}
}
