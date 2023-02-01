import { ApplyOptions } from '@sapphire/decorators';
import { Command } from '@sapphire/framework';
import { GuildMember } from 'discord.js';

@ApplyOptions<Command.Options>({
	description: 'Disconnects the bot from the voice channel'
})
export class DisconnectCommand extends Command {
	public override registerApplicationCommands(registry: Command.Registry) {
		registry.registerChatInputCommand(
			(builder) => {
				builder //
					.setName(this.name)
					.setDescription(this.description);
			},
			{ idHints: ['1017993380191555696'] }
		);
	}

	public override async chatInputRun(interaction: Command.ChatInputCommandInteraction) {
		if (interaction.member instanceof GuildMember) {
			const queue = this.container.client.player.getQueue(interaction.guild!);
			const permissions = this.container.client.perms.voice(interaction, this.container.client);

			if (!queue) return interaction.reply({ content: `${this.container.client.dev.error} | I am not in a voice channel`, ephemeral: true });
			if (permissions.clientToMember()) return interaction.reply({ content: permissions.clientToMember(), ephemeral: true });

			await interaction.deferReply();

			queue.destroy(true);
			return interaction.followUp({
				content: `${this.container.client.dev.success} | I have successfully disconnected from the voice channel`
			});
		}
	}
}
