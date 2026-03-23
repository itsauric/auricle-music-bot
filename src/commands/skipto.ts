import { Command } from '@sapphire/framework';
import { MessageFlags } from 'discord.js';
import { useQueue } from 'discord-player';
import { queueTrackAutocomplete } from '#lib/queue-autocomplete';

export class SkipToCommand extends Command {
	public constructor(context: Command.LoaderContext, options: Command.Options) {
		super(context, {
			...options,
			description: 'Skips to the given track whilst removing previous tracks'
		});
	}

	public override registerApplicationCommands(registry: Command.Registry) {
		registry.registerChatInputCommand((builder) => {
			builder //
				.setName(this.name)
				.setDescription(this.description)
				.addIntegerOption((option) =>
					option.setName('track').setDescription('The track you want to skip to').setMinValue(1).setRequired(true).setAutocomplete(true)
				);
		});
	}

	public override autocompleteRun(interaction: Command.AutocompleteInteraction) {
		return queueTrackAutocomplete(interaction);
	}

	public override async chatInputRun(interaction: Command.ChatInputCommandInteraction) {
		const { emojis, voice } = this.container.client.utils;
		const queue = useQueue(interaction.guild!.id);
		const permissions = voice(interaction);

		if (!queue) return interaction.reply({ content: `${emojis.error} | I am **not** in a voice channel`, flags: MessageFlags.Ephemeral });
		if (!queue.tracks.size)
			return interaction.reply({
				content: `${emojis.error} | There are **no tracks** to **skip** to`,
				flags: MessageFlags.Ephemeral
			});

		if (permissions.clientToMember) return interaction.reply({ content: permissions.clientToMember, flags: MessageFlags.Ephemeral });

		const skip = interaction.options.getInteger('track')! - 1;
		const trackResolvable = queue.tracks.at(skip!);

		if (!trackResolvable)
			return interaction.reply({
				content: `${emojis.error} | The **requested track** doesn't **exist**`,
				flags: MessageFlags.Ephemeral
			});

		queue.node.skipTo(trackResolvable);
		return interaction.reply({
			content: `${emojis.skip} | Skipped to: **${trackResolvable.title}**`
		});
	}
}
