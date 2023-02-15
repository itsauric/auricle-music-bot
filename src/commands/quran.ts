import { quran } from '@quranjs/api';
import type { ChapterId } from '@quranjs/api/dist/types';
import { Command } from '@sapphire/framework';
import type { GuildMember } from 'discord.js';

export class QuranCommand extends Command {
	public constructor(context: Command.Context, options: Command.Options) {
		super(context, {
			...options,
			description: 'Enqueues the Holy Quran from Reciter Mishary Rashid Alafasy'
		});
	}

	public override registerApplicationCommands(registry: Command.Registry) {
		registry.registerChatInputCommand((builder) => {
			builder //
				.setName(this.name)
				.setDescription(this.description)
				.addIntegerOption((option) =>
					option
						.setName('surah')
						.setDescription('The chapter number you want to listen to')
						.setMinValue(1)
						.setMaxValue(114)
						.setRequired(true)
				);
		});
	}

	public override async chatInputRun(interaction: Command.ChatInputCommandInteraction) {
		const member = interaction.member as GuildMember;
		const permissions = this.container.client.perms.voice(interaction, this.container.client);
		if (permissions.member()) return interaction.reply({ content: permissions.member(), ephemeral: true });
		if (permissions.client()) return interaction.reply({ content: permissions.client(), ephemeral: true });

		const surah = interaction.options.getInteger('surah') as ChapterId;
		const audio = quran.v4.audio.findChapterRecitationById(surah, '7');

		if (permissions.clientToMember()) return interaction.reply({ content: permissions.clientToMember(), ephemeral: true });

		await interaction.deferReply();

		try {
			await this.container.client.player.play(member.voice.channel!.id, (await audio).audioUrl!, {
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
				content: `${this.container.client.dev.success} | Successfully enqueued **Chapter ${(await audio).chapterId}** of the **Holy Quran**`
			});
		} catch (error: any) {
			await interaction.editReply({ content: `${this.container.client.dev.error} | An error has occurred` });
			return console.log(error);
		}
	}
}
