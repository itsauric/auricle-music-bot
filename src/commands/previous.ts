import { Command } from '@sapphire/framework';
import { MessageFlags } from 'discord.js';
import { useHistory, useQueue } from 'discord-player';
import { makeEmbed } from '#lib/utils';

export class PreviousCommand extends Command {
	public constructor(context: Command.LoaderContext, options: Command.Options) {
		super(context, {
			...options,
			description: 'Plays the previous track'
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
		const history = useHistory(interaction.guild!.id);
		const permissions = voice(interaction);

		if (!queue) return interaction.reply({ embeds: [makeEmbed(`${emojis.error} | I am **not** in a voice channel`)], flags: MessageFlags.Ephemeral });
		if (permissions.clientToMember) return interaction.reply({ embeds: [makeEmbed(permissions.clientToMember)], flags: MessageFlags.Ephemeral });

		if (!history?.previousTrack)
			return interaction.reply({
				embeds: [makeEmbed(`${emojis.error} | There is **no** previous track in the **history**`)],
				flags: MessageFlags.Ephemeral
			});

		await history.previous();
		return interaction.reply({ embeds: [makeEmbed(`${emojis.previous} | Playing the **previous track**`)] });
	}
}
