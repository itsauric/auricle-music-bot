import { container, Listener } from '@sapphire/framework';
import type { GuildQueue, Track } from 'discord-player';
import { useTimeline } from 'discord-player';
import { ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType, EmbedBuilder, MessageFlags } from 'discord.js';
import type { GuildMember, GuildTextBasedChannel } from 'discord.js';
import { BRAND_COLOR, makeEmbed } from '../../lib/utils';

export class PlayerEvent extends Listener {
	public constructor(context: Listener.LoaderContext, options: Listener.Options) {
		super(context, {
			...options,
			emitter: container.client.player.events,
			event: 'playerStart'
		});
	}

	public async run(queue: GuildQueue<{ channel: GuildTextBasedChannel }>, track: Track) {
		const { emojis, voice } = container.client.utils;
		const permissions = voice(queue.metadata.channel);
		if (permissions.events) return;

		const remaining = queue.tracks.size;
		const footerText = remaining > 0 ? `${remaining} track${remaining === 1 ? '' : 's'} remaining` : 'Last track in queue';

		const fields: { name: string; value: string; inline: boolean }[] = [
			{ name: '⏱ Duration', value: `\`${track.duration || 'Unknown'}\``, inline: true }
		];

		if (track.requestedBy) {
			fields.push({ name: '👤 Requested by', value: `<@${track.requestedBy.id}>`, inline: true });
		}

		const embed = new EmbedBuilder()
			.setColor(BRAND_COLOR)
			.setAuthor({ name: '▶  Now Playing', iconURL: queue.guild.iconURL() ?? undefined })
			.setTitle(track.title.slice(0, 256) || 'Unknown Title')
			.setURL(track.url)
			.setDescription(`by **${track.author || 'Unknown'}**`)
			.setThumbnail(track.thumbnail ?? null)
			.addFields(fields)
			.setFooter({ text: footerText });

		const pauseButton = new ButtonBuilder()
			.setCustomId('player_pause')
			.setLabel('Pause')
			.setEmoji('⏸️')
			.setStyle(ButtonStyle.Secondary);

		const skipButton = new ButtonBuilder()
			.setCustomId('player_skip')
			.setLabel('Skip')
			.setEmoji('⏭️')
			.setStyle(ButtonStyle.Secondary);

		const row = new ActionRowBuilder<ButtonBuilder>().addComponents(pauseButton, skipButton);
		const message = await queue.metadata.channel.send({ embeds: [embed], components: [row] });

		const collectorTime = track.durationMS > 0 ? track.durationMS + 10_000 : 600_000;

		const collector = message.createMessageComponentCollector({
			componentType: ComponentType.Button,
			time: collectorTime
		});

		collector.on('collect', async (i) => {
			const member = i.member as GuildMember;
			if (member.voice.channelId !== queue.guild.members.me?.voice.channelId) {
				await i.reply({ embeds: [makeEmbed(`${emojis.error} | You need to be in my voice channel`)], flags: MessageFlags.Ephemeral });
				return;
			}

			if (queue.currentTrack?.url !== track.url) {
				await i.update({ components: [] });
				collector.stop('track_changed');
				return;
			}

			if (i.customId === 'player_skip') {
				queue.node.skip();
				await i.update({ components: [] });
				collector.stop('skipped');
			} else if (i.customId === 'player_pause') {
				const timeline = useTimeline({ node: queue.guild.id });
				if (!timeline) {
					await i.deferUpdate();
					return;
				}

				const wasPaused = timeline.paused;
				wasPaused ? timeline.resume() : timeline.pause();

				const updatedPause = new ButtonBuilder()
					.setCustomId('player_pause')
					.setLabel(wasPaused ? 'Pause' : 'Resume')
					.setEmoji(wasPaused ? '⏸️' : '▶️')
					.setStyle(ButtonStyle.Secondary);

				const updatedRow = new ActionRowBuilder<ButtonBuilder>().addComponents(updatedPause, skipButton);
				await i.update({ components: [updatedRow] });
			}
		});

		collector.on('end', () => {
			message.edit({ components: [] }).catch(() => null);
		});
	}
}
