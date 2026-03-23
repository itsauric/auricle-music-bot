import { Command } from '@sapphire/framework';
import { QueueRepeatMode, useQueue } from 'discord-player';
import { MessageFlags } from 'discord.js';
import { makeEmbed } from '#lib/utils';

export class AutoplayCommand extends Command {
	public constructor(context: Command.LoaderContext, options: Command.Options) {
		super(context, {
			...options,
			description: 'Toggles autoplay — automatically queues related tracks when the queue ends'
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
		const { emojis, voice } = this.container.client.utils;
		const queue = useQueue(interaction.guild!.id);
		const permissions = voice(interaction);

		if (!queue) return interaction.reply({ embeds: [makeEmbed(`${emojis.error} | I am **not** in a voice channel`)], flags: MessageFlags.Ephemeral });
		if (!queue.currentTrack)
			return interaction.reply({ embeds: [makeEmbed(`${emojis.error} | There is no track **currently** playing`)], flags: MessageFlags.Ephemeral });
		if (permissions.clientToMember) return interaction.reply({ embeds: [makeEmbed(permissions.clientToMember)], flags: MessageFlags.Ephemeral });

		const isEnabled = queue.repeatMode === QueueRepeatMode.AUTOPLAY;
		queue.setRepeatMode(isEnabled ? QueueRepeatMode.OFF : QueueRepeatMode.AUTOPLAY);

		return interaction.reply({
			embeds: [makeEmbed(`${emojis.autoplay} | **Autoplay** has been **${isEnabled ? 'disabled' : 'enabled'}**`)]
		});
	}
}
