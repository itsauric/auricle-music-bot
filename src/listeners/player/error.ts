import { container, Listener } from '@sapphire/framework';
import { QueueRepeatMode } from 'discord-player';
import type { GuildQueue } from 'discord-player';
import type { GuildTextBasedChannel } from 'discord.js';

export class PlayerEvent extends Listener {
	public constructor(context: Listener.LoaderContext, options: Listener.Options) {
		super(context, {
			...options,
			emitter: container.client.player.events,
			event: 'error'
		});
	}

	public run(queue: GuildQueue<{ channel: GuildTextBasedChannel }>, error: Error) {
		container.logger.error(`[${queue.guild.name}] Error emitted from the queue: ${error.message}`);

		if (queue.repeatMode === QueueRepeatMode.AUTOPLAY) {
			queue.setRepeatMode(QueueRepeatMode.OFF);
			const { emojis, voice } = container.client.utils;
			const permissions = voice(queue.metadata.channel);
			if (!permissions.events) {
				queue.metadata.channel
					.send(`${emojis.warning} | **Autoplay** encountered an error and has been **disabled**`)
					.then((m) => setTimeout(() => m.delete().catch(() => null), 10_000));
			}
		}
	}
}
