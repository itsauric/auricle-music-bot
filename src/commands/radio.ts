import { Command } from '@sapphire/framework';
import { useMasterPlayer } from 'discord-player';
import type { GuildMember } from 'discord.js';

export class RadioCommand extends Command {
	public constructor(context: Command.Context, options: Command.Options) {
		super(context, {
			...options,
			description: 'Plays the query of the given radio'
		});
	}

	public override registerApplicationCommands(registry: Command.Registry) {
		registry.registerChatInputCommand((builder) => {
			builder //
				.setName(this.name)
				.setDescription(this.description)
				.addStringOption((option) => {
					return option.setName('query').setDescription('A radio of your choice').setRequired(true);
				});
		});
	}

	public override async chatInputRun(interaction: Command.ChatInputCommandInteraction) {
		const player = useMasterPlayer();
		const member = interaction.member as GuildMember;
		const permissions = this.container.client.perms.voice(interaction, this.container.client);
		if (permissions.member()) return interaction.reply({ content: permissions.member(), ephemeral: true });
		if (permissions.client()) return interaction.reply({ content: permissions.client(), ephemeral: true });

		const query = interaction.options.getString('query') as string;

		if (permissions.clientToMember()) return interaction.reply({ content: permissions.clientToMember(), ephemeral: true });

		const results = await this.container.client.radio.search(query!);

		if (!results)
			return interaction.reply({
				content: `${this.container.client.dev.error} | **No** radios were found for your query`,
				ephemeral: true
			});

		await interaction.deferReply();
		await interaction.editReply({ content: `⏳ | Loading radio...` });

		try {
			await player!.play(member.voice.channel!.id, results.url_resolved, {
				nodeOptions: {
					metadata: {
						channel: interaction.channel,
						client: interaction.guild?.members.me,
						requestedBy: interaction.user.username
					},
					leaveOnEmptyCooldown: 300000,
					leaveOnEmpty: true,
					leaveOnEnd: false,
					bufferingTimeout: 0
					// defaultFFmpegFilters: ['lofi', 'bassboost', 'normalizer'],
					// volume: 120
				}
			});
			return interaction.editReply({
				content: `${this.container.client.dev.success} | Successfully enqueued: **${results.name || 'Unknown Radio'}**`
			});
		} catch (error) {
			await interaction.editReply({ content: `${this.container.client.dev.error} | An **error** has occurred` });
			return console.log(error);
		}
	}
}
