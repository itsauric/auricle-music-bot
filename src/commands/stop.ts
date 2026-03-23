import { Command } from '@sapphire/framework';
import { useQueue } from 'discord-player';
import { MessageFlags } from 'discord.js';
import { makeEmbed } from '#lib/utils';

export class StopCommand extends Command {
	public constructor(context: Command.LoaderContext, options: Command.Options) {
		super(context, {
			...options,
			description: 'Stops playback and clears the queue without disconnecting'
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
		if (!queue.currentTrack && !queue.tracks.size)
			return interaction.reply({ embeds: [makeEmbed(`${emojis.error} | There is nothing **currently** playing`)], flags: MessageFlags.Ephemeral });
		if (permissions.clientToMember) return interaction.reply({ embeds: [makeEmbed(permissions.clientToMember)], flags: MessageFlags.Ephemeral });

		queue.tracks.clear();
		if (queue.currentTrack) queue.node.skip();

		return interaction.reply({
			embeds: [makeEmbed(`${emojis.stop} | Playback **stopped** - I'll leave in 5 minutes if nothing is added`)]
		});
	}
}
