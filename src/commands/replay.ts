import { Command } from '@sapphire/framework';
import { useQueue } from 'discord-player';
import { MessageFlags } from 'discord.js';
import { makeEmbed } from '#lib/utils';

export class ReplayCommand extends Command {
	public constructor(context: Command.LoaderContext, options: Command.Options) {
		super(context, {
			...options,
			description: 'Restarts the current track from the beginning'
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

		await queue.node.seek(0);
		return interaction.reply({ embeds: [makeEmbed(`${emojis.replay} | Replaying: **${queue.currentTrack.title}**`)] });
	}
}
