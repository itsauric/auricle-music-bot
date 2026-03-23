import { Command } from '@sapphire/framework';
import { useQueue } from 'discord-player';
import { EmbedBuilder, MessageFlags } from 'discord.js';
import { BRAND_COLOR, makeEmbed } from '#lib/utils';

export class SaveCommand extends Command {
	public constructor(context: Command.LoaderContext, options: Command.Options) {
		super(context, {
			...options,
			description: 'DMs you the currently playing track so you can save it'
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
		const { emojis } = this.container.client.utils;
		const queue = useQueue(interaction.guild!.id);

		if (!queue) return interaction.reply({ embeds: [makeEmbed(`${emojis.error} | I am **not** in a voice channel`)], flags: MessageFlags.Ephemeral });
		if (!queue.currentTrack)
			return interaction.reply({ embeds: [makeEmbed(`${emojis.error} | There is no track **currently** playing`)], flags: MessageFlags.Ephemeral });

		const track = queue.currentTrack;
		const embed = new EmbedBuilder()
			.setColor(BRAND_COLOR)
			.setAuthor({ name: '💾 Saved Track', iconURL: interaction.user.displayAvatarURL() })
			.setTitle(track.title.slice(0, 256))
			.setURL(track.url)
			.setDescription(`by **${track.author || 'Unknown'}**`)
			.setThumbnail(track.thumbnail ?? null)
			.addFields([
				{ name: '⏱ Duration', value: `\`${track.duration || 'Unknown'}\``, inline: true },
				{ name: '📌 Saved from', value: `**${interaction.guild!.name}**`, inline: true }
			])
			.setTimestamp()
			.setFooter({ text: 'Auricle' });

		try {
			await interaction.user.send({ embeds: [embed] });
			return interaction.reply({ embeds: [makeEmbed(`${emojis.save} | Track saved to your **DMs**`)], flags: MessageFlags.Ephemeral });
		} catch {
			return interaction.reply({
				embeds: [makeEmbed(`${emojis.error} | I couldn't DM you - please **enable DMs** from server members`)],
				flags: MessageFlags.Ephemeral
			});
		}
	}
}
