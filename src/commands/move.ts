import { Command } from '@sapphire/framework';
import { useQueue } from 'discord-player';

export class moveCommand extends Command {
	public constructor(context: Command.Context, options: Command.Options) {
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

	public override async autocompleteRun(interaction: Command.AutocompleteInteraction) {
		const queue = useQueue(interaction.guild!.id);
		const track = interaction.options.getInteger('track');
		const move = queue?.tracks.at(track!);
		const position = queue?.node.getTrackPosition(move!);

		const tracks = queue!.tracks.map((t, idx) => ({
			name: t.title,
			value: ++idx
		}));

		if (move?.title && !tracks.some((t) => t.name === move.title)) {
			tracks.unshift({
				name: move.title,
				value: position!
			});
		}

		let slicedTracks = tracks.slice(0, 5);
		if (track) {
			slicedTracks = tracks.slice(track - 1, track + 4);
			if (slicedTracks.length > 5) {
				slicedTracks = slicedTracks.slice(0, 5);
			}
		}

		return interaction.respond(slicedTracks);
	}

	public override async chatInputRun(interaction: Command.ChatInputCommandInteraction) {
		const { emojis, voice } = this.container.client.utils;
		const queue = useQueue(interaction.guild!.id);
		const permissions = voice(interaction);

		if (!queue) return interaction.reply({ content: `${emojis.error} | I am **not** in a voice channel`, ephemeral: true });
		if (!queue.tracks)
			return interaction.reply({
				content: `${emojis.error} | There are **no tracks** to **move** to`,
				ephemeral: true
			});
		if (permissions.clientToMember) return interaction.reply({ content: permissions.clientToMember, ephemeral: true });

		const move = interaction.options.getInteger('track')! - 1;
		const position = interaction.options.getInteger('position')! - 1;
		const trackResolvable = queue.tracks.at(move!);

		if (!trackResolvable)
			return interaction.reply({
				content: `${emojis.error} | The **requested track** doesn't **exist**`,
				ephemeral: true
			});
		if (position > queue.tracks.size)
			return interaction.reply({
				content: `${emojis.error} | The **requested position** doesn't **exist**`,
				ephemeral: true
			});

		queue.node.move(trackResolvable, position);
		return interaction.reply({
			content: `${emojis.success} | I have **moved** the track: **${trackResolvable.title}**`
		});
	}
}
