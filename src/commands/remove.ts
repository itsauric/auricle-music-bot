import { Command } from '@sapphire/framework';
import { MessageFlags } from 'discord.js';
import { useQueue } from 'discord-player';
import { queueTrackAutocomplete } from '#lib/queue-autocomplete';

export class RemoveCommand extends Command {
	public constructor(context: Command.LoaderContext, options: Command.Options) {
		super(context, {
			...options,
			description: 'Removes the given track'
		});
	}

	public override registerApplicationCommands(registry: Command.Registry) {
		registry.registerChatInputCommand((builder) => {
			builder //
				.setName(this.name)
				.setDescription(this.description)
				.addIntegerOption((option) =>
					option.setName('track').setDescription('The track you want to remove').setMinValue(1).setRequired(true).setAutocomplete(true)
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
				content: `${emojis.error} | There are **no tracks** to **remove**`,
				flags: MessageFlags.Ephemeral
			});
		if (permissions.clientToMember) return interaction.reply({ content: permissions.clientToMember, flags: MessageFlags.Ephemeral });

		const remove = interaction.options.getInteger('track')! - 1;
		const trackResolvable = queue.tracks.at(remove!);

		if (!trackResolvable)
			return interaction.reply({
				content: `${emojis.error} | The **requested track** doesn't **exist**`,
				flags: MessageFlags.Ephemeral
			});

		queue.node.remove(trackResolvable);
		return interaction.reply({
			content: `${emojis.remove} | I have **removed** the track: **${trackResolvable.title}**`
		});
	}
}
