import { Command } from '@sapphire/framework';
import { useQueue } from 'discord-player';
import { MessageFlags } from 'discord.js';

export class ClearCommand extends Command {
	public constructor(context: Command.LoaderContext, options: Command.Options) {
		super(context, {
			...options,
			description: 'Clears the current queue and removes all enqueued tracks'
		});
	}

	public override registerApplicationCommands(registry: Command.Registry) {
		registry.registerChatInputCommand((builder) => {
			builder //
				.setName(this.name)
				.setDescription(this.description)
				.addBooleanOption((option) => option.setName('history').setDescription('Clear the queue history'));
		});
	}

	public override async chatInputRun(interaction: Command.ChatInputCommandInteraction) {
		const { emojis, voice } = this.container.client.utils;
		const queue = useQueue(interaction.guild!.id);
		const permissions = voice(interaction);
		const history = interaction.options.getBoolean('history');

		if (!queue) return interaction.reply({ content: `${emojis.error} | I am **not** in a voice channel`, flags: MessageFlags.Ephemeral });
		if (!queue.tracks) return interaction.reply({ content: `${emojis.error} | There is **nothing** to clear`, flags: MessageFlags.Ephemeral });
		if (permissions.clientToMember) return interaction.reply({ content: permissions.clientToMember, flags: MessageFlags.Ephemeral });

		queue.tracks.clear();
		if (history) queue.history.clear();
		return interaction.reply({
			content: `${emojis.success} | I have **cleared** the queue`
		});
	}
}
