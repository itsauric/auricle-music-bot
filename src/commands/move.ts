import { Command } from '@sapphire/framework';
import { MessageFlags } from 'discord.js';
import { useQueue } from 'discord-player';
import { queueTrackAutocomplete } from '#lib/queue-autocomplete';
import { makeEmbed } from '#lib/utils';

export class MoveCommand extends Command {
	public constructor(context: Command.LoaderContext, options: Command.Options) {
		super(context, {
			...options,
			description: "Moves the given track's position to the position requested"
		});
	}

	public override registerApplicationCommands(registry: Command.Registry) {
		registry.registerChatInputCommand((builder) => {
			builder //
				.setName(this.name)
				.setDescription(this.description)
				.addIntegerOption((option) =>
					option.setName('track').setDescription('The track you want to move').setMinValue(1).setRequired(true).setAutocomplete(true)
				)
				.addIntegerOption((option) =>
					option.setName('position').setDescription('The queue position you want to the track to move to').setMinValue(1).setRequired(true)
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

		if (!queue) return interaction.reply({ embeds: [makeEmbed(`${emojis.error} | I am **not** in a voice channel`)], flags: MessageFlags.Ephemeral });
		if (!queue.tracks.size)
			return interaction.reply({
				embeds: [makeEmbed(`${emojis.error} | There are **no tracks** to **move** to`)],
				flags: MessageFlags.Ephemeral
			});
		if (permissions.clientToMember) return interaction.reply({ embeds: [makeEmbed(permissions.clientToMember)], flags: MessageFlags.Ephemeral });

		const move = interaction.options.getInteger('track')! - 1;
		const position = interaction.options.getInteger('position')! - 1;
		const trackResolvable = queue.tracks.at(move!);

		if (!trackResolvable)
			return interaction.reply({
				embeds: [makeEmbed(`${emojis.error} | The **requested track** doesn't **exist**`)],
				flags: MessageFlags.Ephemeral
			});
		if (position > queue.tracks.size)
			return interaction.reply({
				embeds: [makeEmbed(`${emojis.error} | The **requested position** doesn't **exist**`)],
				flags: MessageFlags.Ephemeral
			});

		queue.node.move(trackResolvable, position);
		return interaction.reply({ embeds: [makeEmbed(`${emojis.move} | I have **moved** the track: **${trackResolvable.title}**`)] });
	}
}
