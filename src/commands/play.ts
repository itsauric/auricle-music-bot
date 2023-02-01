import { ApplyOptions } from '@sapphire/decorators';
import { Command } from '@sapphire/framework';
import { QueryType } from 'discord-player';
import type { GuildMember } from 'discord.js';

@ApplyOptions<Command.Options>({
	description: 'Plays the given query'
})
export class PlayCommand extends Command {
	public override registerApplicationCommands(registry: Command.Registry) {
		registry.registerChatInputCommand(
			(builder) => {
				builder //
					.setName(this.name)
					.setDescription(this.description)
					.addStringOption((option) => option.setName('query').setDescription('A query of your choice').setRequired(true));
			},
			{ idHints: ['1017993587096563732'] }
		);
	}

	public override async chatInputRun(interaction: Command.ChatInputCommandInteraction) {
		const member = interaction.member as GuildMember;
		const permissions = this.container.client.perms.voice(interaction, this.container.client);
		if (permissions.member()) return interaction.reply({ content: permissions.member(), ephemeral: true });
		if (permissions.client()) return interaction.reply({ content: permissions.client(), ephemeral: true });

		const query = interaction.options.getString('query');
		const queue = await this.container.client.player.createQueue(interaction.guild!, {
			metadata: {
				channel: interaction.channel,
				client: interaction.guild?.members.me
			},
			leaveOnEmptyCooldown: 300000,
			leaveOnEmpty: true,
			leaveOnEnd: false
		});

		if (permissions.clientToMember()) return interaction.reply({ content: permissions.clientToMember(), ephemeral: true });

		const results = await this.container.client.player.search(query!, {
			requestedBy: interaction.user,
			searchEngine: QueryType.AUTO
		});

		if (!results.hasTracks())
			return interaction.reply({
				content: `${this.container.client.dev.error} | No tracks were found for your query`,
				ephemeral: true
			});

		await interaction.deferReply();
		await interaction.editReply({ content: `⏱️ | Loading ${results.playlist ? 'a playlist...' : 'a track...'}` });

		try {
			if (!queue.connection) await queue.connect(member.voice.channel!);
			await interaction.editReply({
				content: `${this.container.client.dev.success} | Successfully loaded ${results.playlist ? 'the playlist' : 'the track'}`
			});
		} catch (error) {
			this.container.client.player.deleteQueue(interaction.guild!);
			await interaction.editReply({ content: `${this.container.client.dev.error} | An error has occurred` });
			return console.log(error);
		}

		results.playlist ? queue.addTracks(results.tracks) : queue.addTrack(results.tracks[0]);
		if (!queue.playing) await queue.play();
	}
}
