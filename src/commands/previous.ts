import { Command } from '@sapphire/framework';
import { MessageFlags } from 'discord.js';
import { useHistory, useQueue } from 'discord-player';

export class PreviousCommand extends Command {
	public constructor(context: Command.LoaderContext, options: Command.Options) {
		super(context, {
			...options,
			description: 'Plays the previous track'
		});
	}

	public override registerApplicationCommands(registry: Command.Registry) {
		registry.registerChatInputCommand((builder) => {
			builder //
				.setName(this.name)
				.setDescription(this.description);
		});
	}

	public override async chatInputRun(interaction: Command.ChatInputCommandInteraction) {
		const { emojis, voice } = this.container.client.utils;
		const queue = useQueue(interaction.guild!.id);
		const history = useHistory(interaction.guild!.id);
		const permissions = voice(interaction);

		if (!queue) return interaction.reply({ content: `${emojis.error} | I am **not** in a voice channel`, flags: MessageFlags.Ephemeral });
		if (permissions.clientToMember) return interaction.reply({ content: permissions.clientToMember, flags: MessageFlags.Ephemeral });

		if (!history?.previousTrack)
			return interaction.reply({
				content: `${emojis.error} | There is **no** previous track in the **history**`,
				flags: MessageFlags.Ephemeral
			});

		await history.previous();
		return interaction.reply({
			content: `🔁 | I am **replaying** the previous track`
		});
	}
}
