import { Command } from '@sapphire/framework';
import { ApplicationCommandType, ApplicationIntegrationType, InteractionContextType, Message } from 'discord.js';
import { makeEmbed } from '#lib/utils';

export class PingCommand extends Command {
	public constructor(context: Command.LoaderContext, options: Command.Options) {
		super(context, {
			...options,
			description: 'Returns the bot and api latency'
		});
	}

	public override registerApplicationCommands(registry: Command.Registry) {
		const integrationTypes: ApplicationIntegrationType[] = [ApplicationIntegrationType.GuildInstall, ApplicationIntegrationType.UserInstall];
		const contexts: InteractionContextType[] = [
			InteractionContextType.BotDM,
			InteractionContextType.Guild,
			InteractionContextType.PrivateChannel
		];

		registry.registerChatInputCommand({
			name: this.name,
			description: this.description,
			integrationTypes,
			contexts
		});

		registry.registerContextMenuCommand({
			name: this.name,
			type: ApplicationCommandType.Message,
			integrationTypes,
			contexts
		});

		registry.registerContextMenuCommand({
			name: this.name,
			type: ApplicationCommandType.User,
			integrationTypes,
			contexts
		});
	}

	public override async messageRun(message: Message) {
		const sent = await message.reply({ content: 'Ping?' });
		await sent.edit(
			`Pong! Bot Latency ${Math.round(this.container.client.ws.ping)}ms. API Latency ${sent.createdTimestamp - message.createdTimestamp}ms.`
		);
	}

	public override async chatInputRun(interaction: Command.ChatInputCommandInteraction) {
		const sent = await interaction.reply({ embeds: [makeEmbed('Ping?')], withResponse: true });
		await interaction.editReply({
			embeds: [
				makeEmbed(
					`🏓 **Pong!**\nBot Latency: \`${Math.round(this.container.client.ws.ping)}ms\`\nAPI Latency: \`${sent.resource!.message!.createdTimestamp - interaction.createdTimestamp}ms\``
				)
			]
		});
	}

	public override async contextMenuRun(interaction: Command.ContextMenuCommandInteraction) {
		const sent = await interaction.reply({ embeds: [makeEmbed('Ping?')], withResponse: true });
		await interaction.editReply({
			embeds: [
				makeEmbed(
					`🏓 **Pong!**\nBot Latency: \`${Math.round(this.container.client.ws.ping)}ms\`\nAPI Latency: \`${sent.resource!.message!.createdTimestamp - interaction.createdTimestamp}ms\``
				)
			]
		});
	}
}
