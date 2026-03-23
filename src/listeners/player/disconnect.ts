import { container, Listener } from '@sapphire/framework';
import type { GuildQueue } from 'discord-player';
import type { GuildTextBasedChannel } from 'discord.js';
import { makeEmbed } from '../../lib/utils';

export class PlayerEvent extends Listener {
	public constructor(context: Listener.LoaderContext, options: Listener.Options) {
		super(context, {
			...options,
			emitter: container.client.player.events,
			event: 'disconnect'
		});
	}

	public run(queue: GuildQueue<{ channel: GuildTextBasedChannel }>) {
		const { emojis, voice } = container.client.utils;
		const permissions = voice(queue.metadata.channel);
		if (permissions.events) return;

		return queue.metadata.channel
			.send({ embeds: [makeEmbed(`${emojis.disconnect} | Disconnected from the **voice channel**`)] })
			.then((m) => setTimeout(() => m.delete().catch(() => null), 15_000));
	}
}
