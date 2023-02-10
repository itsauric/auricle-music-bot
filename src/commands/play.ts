import { ApplyOptions } from '@sapphire/decorators';
import { Command } from '@sapphire/framework';
import type { GuildMember } from 'discord.js';

@ApplyOptions<Command.Options>({
	description: 'Plays the given query'
})
export class PlayCommand extends Command {
	public override registerApplicationCommands(registry: Command.Registry) {
		registry.registerChatInputCommand((builder) => {
			builder //
				.setName(this.name)
				.setDescription(this.description)
				.addStringOption((option) => option.setName('query').setDescription('A query of your choice').setRequired(true));
		});
	}

	public override async chatInputRun(interaction: Command.ChatInputCommandInteraction) {
		const member = interaction.member as GuildMember;
		const permissions = this.container.client.perms.voice(interaction, this.container.client);
		if (permissions.member()) return interaction.reply({ content: permissions.member(), ephemeral: true });
		if (permissions.client()) return interaction.reply({ content: permissions.client(), ephemeral: true });

		const query = interaction.options.getString('query');

		if (permissions.clientToMember()) return interaction.reply({ content: permissions.clientToMember(), ephemeral: true });

		const results = await this.container.client.player.search(query!);

		if (!results.hasTracks())
			return interaction.reply({
				content: `${this.container.client.dev.error} | No tracks were found for your query`,
				ephemeral: true
			});

		await interaction.deferReply();
		await interaction.editReply({ content: `⏳ | Loading ${results.playlist ? 'a playlist...' : 'a track...'}` });

		try {
			const res = await this.container.client.player.play(member.voice.channel!, query!, {
				nodeOptions: {
					metadata: {
						channel: interaction.channel,
						client: interaction.guild?.members.me,
						requestedBy: interaction.user.username
					},
					leaveOnEmptyCooldown: 300000,
					leaveOnEmpty: true,
					leaveOnEnd: false
				}
			});

			await interaction.editReply({
				content: `${this.container.client.dev.success} | Successfully enqueued${
					res.track.playlist ? ` **multiple tracks** from: **${res.track.playlist.title}**` : `: **${res.track.title}**`
				}`
			});
		} catch (error: any) {
			await interaction.editReply({ content: `${this.container.client.dev.error} | An error has occurred` });
			return console.log(error);
		}
	}
}
