import { Command } from '@sapphire/framework';
import { ApplicationCommandType } from 'discord.js';

export class PingCommand extends Command {
	public constructor(context: Command.LoaderContext, options: Command.Options) {
		super(context, {
			...options,
			description: 'Returns the round trip'
		});
	}

	public override registerApplicationCommands(registry: Command.Registry) {
		registry.registerChatInputCommand((builder) => {
			builder //
				.setName(this.name)
				.setDescription(this.description);
		});
		registry.registerContextMenuCommand((builder) => {
			builder //
				.setName(this.name)
				.setType(ApplicationCommandType.Message);
		});
		registry.registerContextMenuCommand((builder) => {
			builder //
				.setName(this.name)
				.setType(ApplicationCommandType.User);
		});
	}

	public override async chatInputRun(interaction: Command.ChatInputCommandInteraction) {
		const sent = await interaction.reply({ content: 'Pinging...', withResponse: true });
		interaction.editReply(`Roundtrip latency: ${sent.resource!.message!.createdTimestamp - interaction.createdTimestamp}ms`);
	}

	// context menu command
	public async contextMenuRun(interaction: Command.ContextMenuCommandInteraction) {
		const sent = await interaction.reply({ content: 'Pinging...', withResponse: true });
		interaction.editReply(`Roundtrip latency: ${sent.resource!.message!.createdTimestamp - interaction.createdTimestamp}ms`);
	}
}
