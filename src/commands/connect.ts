import { Command } from '@sapphire/framework';
import { useMainPlayer, useQueue } from 'discord-player';
import { GuildMember, MessageFlags } from 'discord.js';

export class DisconnectCommand extends Command {
	public constructor(context: Command.LoaderContext, options: Command.Options) {
		super(context, {
			...options,
			description: 'Connects the bot to the voice channel while also creating a new queue'
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
		if (interaction.member instanceof GuildMember) {
			const { emojis, voice, options } = this.container.client.utils;
			const permissions = voice(interaction);

			if (permissions.member) return interaction.reply({ content: permissions.member, flags: MessageFlags.Ephemeral });
			if (permissions.client) return interaction.reply({ content: permissions.client, flags: MessageFlags.Ephemeral });
			const queue = useQueue(interaction.guild!.id);
			const player = useMainPlayer();

			if (queue)
				return interaction.reply({
					content: `${emojis.error} | I am **already** in a voice channel`,
					flags: MessageFlags.Ephemeral
				});

			const newQueue = player?.queues.create(interaction.guild!.id, options(interaction));
			await newQueue?.connect(interaction.member.voice.channel!.id);
			return interaction.reply({
				content: `${emojis.success} | I have **successfully connected** to the voice channel`
			});
		}
	}
}
