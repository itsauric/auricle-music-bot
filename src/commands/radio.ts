import { Command } from '@sapphire/framework';
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
		const member = interaction.member as GuildMember;
		const query = interaction.options.getString('query') as string;
		const data = this.container.client.radio.current().name || 'Unknown Radio';

		try {
			await this.container.client.radio.play({ query, voice: member.voice.channel! });
			if (this.container.client.radio.playing) {
				const newData = this.container.client.radio.current().name || 'Unknown Radio';
				return interaction.reply({ content: `Switching to: **${newData}** from **${data}**` });
			}

			return interaction.reply(`Now playing: **${data}**`);
		} catch (error) {
			console.log(error);
			return interaction.reply('No radios were found...');
		}
	}
}
