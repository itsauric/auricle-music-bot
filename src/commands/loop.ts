import { ApplyOptions } from '@sapphire/decorators';
import { Command } from '@sapphire/framework';
import { GuildMember } from 'discord.js';

@ApplyOptions<Command.Options>({
	description: 'Loops the current playing song or queue'
})
export class LoopCommand extends Command {
	public override registerApplicationCommands(registry: Command.Registry) {
		registry.registerChatInputCommand(
			(builder) => {
				builder //
					.setName(this.name)
					.setDescription(this.description)
					.addNumberOption((option) =>
						option
							.setName('mode')
							.setDescription('Choose a loop mode')
							.setRequired(true)
							.addChoices(
								{ name: 'Off', value: 0 },
								{ name: 'Track', value: 1 },
								{ name: 'Queue', value: 2 },
								{ name: 'Autoplay', value: 3 }
							)
					);
			},
			{ idHints: ['1018203517430792263'] }
		);
	}

	public override async chatInputRun(interaction: Command.ChatInputCommandInteraction) {
		if (interaction.member instanceof GuildMember) {
			const queue = this.container.client.player.getQueue(interaction.guild!);
			const permissions = this.container.client.perms.voice(interaction, this.container.client);

			if (!queue) return interaction.reply({ content: `${this.container.client.dev.error} | I am not in a voice channel`, ephemeral: true });
			if (permissions.clientToMember()) return interaction.reply({ content: permissions.clientToMember(), ephemeral: true });

			if (!queue.current)
				return interaction.reply({
					content: `${this.container.client.dev.error} | There is no song currently playing`,
					ephemeral: true
				});

			await interaction.deferReply();

			const mode = interaction.options.getNumber('mode');
			const { repeatMode } = queue;

			if (mode === 0) {
				if (repeatMode !== 0) {
					await queue.setRepeatMode(0);
					return interaction.followUp({
						content: `${this.container.client.dev.success} | **Loop** has been **disabled**`
					});
				}

				return interaction.followUp({
					content: `${this.container.client.dev.error} | **Loop** has already been **disabled**`
				});
			}

			if (mode === 1) {
				if (repeatMode !== 1) {
					await queue.setRepeatMode(1);
					return interaction.followUp({
						content: `${this.container.client.dev.success} | **Track loop** has been **enabled**`
					});
				}
				return interaction.followUp({
					content: `${this.container.client.dev.error} | **Track loop** has already been **enabled**`
				});
			}

			if (mode === 2) {
				if (repeatMode !== 2) {
					await queue.setRepeatMode(2);
					return interaction.followUp({
						content: `${this.container.client.dev.success} | **Queue loop** has been **enabled**`
					});
				}
				return interaction.followUp({
					content: `${this.container.client.dev.error} | **Queue loop** has already been **enabled**`
				});
			}

			if (mode === 3) {
				if (repeatMode !== 3) {
					await queue.setRepeatMode(3);
					return interaction.followUp({
						content: `${this.container.client.dev.success} | **Autoplay** has been **enabled**`
					});
				}

				return interaction.followUp({
					content: `${this.container.client.dev.error} | **Autoplay** has already been **enabled**`
				});
			}
		}
	}
}
