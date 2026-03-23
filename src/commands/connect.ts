import { Command } from '@sapphire/framework';
import { useMainPlayer, useQueue } from 'discord-player';
import { GuildMember, MessageFlags } from 'discord.js';

export class ConnectCommand extends Command {
	public constructor(context: Command.LoaderContext, options: Command.Options) {
		super(context, {
			...options,
			description: 'Connects the bot to your voice channel and creates a queue'
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
		const { emojis, voice, options } = this.container.client.utils;

		if (!(interaction.member instanceof GuildMember))
			return interaction.reply({ content: `${emojis.error} | This command must be used in a server`, flags: MessageFlags.Ephemeral });

		const permissions = voice(interaction);
		if (permissions.member) return interaction.reply({ content: permissions.member, flags: MessageFlags.Ephemeral });
		if (permissions.client) return interaction.reply({ content: permissions.client, flags: MessageFlags.Ephemeral });

		if (useQueue(interaction.guild!.id))
			return interaction.reply({ content: `${emojis.error} | I am **already** in a voice channel`, flags: MessageFlags.Ephemeral });

		try {
			const player = useMainPlayer()!;
			const queue = player.queues.create(interaction.guild!.id, options(interaction));
			await queue.connect(interaction.member.voice.channel!.id);
			return interaction.reply({ content: `${emojis.connect} | **Connected** to the voice channel` });
		} catch (error: unknown) {
			this.container.logger.error(error);
			return interaction.reply({ content: `${emojis.error} | Failed to connect to the voice channel`, flags: MessageFlags.Ephemeral });
		}
	}
}
