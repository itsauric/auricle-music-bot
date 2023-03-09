import { Command } from '@sapphire/framework';
import { useQueue } from 'discord-player';

export class SkipToCommand extends Command {
	public constructor(context: Command.Context, options: Command.Options) {
		super(context, {
			...options,
			description: 'Skips to the given track and automatically plays it'
		});
	}

	public override registerApplicationCommands(registry: Command.Registry) {
		registry.registerChatInputCommand((builder) => {
			builder //
				.setName(this.name)
				.setDescription(this.description)
				.addIntegerOption((option) =>
					option.setName('track').setDescription('The track you want to skip to').setMinValue(1).setRequired(true)
				);
		});
	}

	public override async chatInputRun(interaction: Command.ChatInputCommandInteraction) {
		const queue = useQueue(interaction.guild!.id);
		const permissions = this.container.client.perms.voice(interaction, this.container.client);

		if (!queue) return interaction.reply({ content: `${this.container.client.dev.error} | I am **not** in a voice channel`, ephemeral: true });
		if (permissions.clientToMember()) return interaction.reply({ content: permissions.clientToMember(), ephemeral: true });

		let skipTrack = interaction.options.getInteger('track');
		skipTrack! -= 1;
		const trackResolvable = queue.tracks.at(skipTrack!);

		if (!trackResolvable)
			return interaction.reply({ content: `${this.container.client.dev.error} | The **requested track** doesn't **exist**`, ephemeral: true });

		queue.node.skipTo(trackResolvable);
		return interaction.reply({
			content: `⏩ | I have **skipped** to the given track`
		});
	}
}
