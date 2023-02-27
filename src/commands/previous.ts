import { Command } from '@sapphire/framework';
import { useHistory, useQueue } from 'discord-player';
import { GuildMember } from 'discord.js';

export class PreviousCommand extends Command {
	public constructor(context: Command.Context, options: Command.Options) {
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
		if (interaction.member instanceof GuildMember) {
			const queue = useQueue(interaction.guild!.id);
			const history = useHistory(interaction.guild!.id);
			const permissions = this.container.client.perms.voice(interaction, this.container.client);
			if (permissions.member()) return interaction.reply({ content: permissions.member(), ephemeral: true });
			if (permissions.client()) return interaction.reply({ content: permissions.client(), ephemeral: true });

			if (!queue)
				return interaction.reply({ content: `${this.container.client.dev.error} | I am **not** in a voice channel`, ephemeral: true });
			if (permissions.clientToMember()) return interaction.reply({ content: permissions.clientToMember(), ephemeral: true });

			if (!history?.previousTrack)
				return interaction.reply({
					content: `${this.container.client.dev.error} | There is **no** previous track in the **history**`,
					ephemeral: true
				});

			await interaction.deferReply();

			await history.previous();
			return interaction.followUp({
				content: `🔁 | I am **replaying** the previous track`
			});
		}
	}
}
