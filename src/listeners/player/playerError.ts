import { container, Listener } from '@sapphire/framework';
import type { GuildQueue, Track } from 'discord-player';
import type { GuildTextBasedChannel } from 'discord.js';

export class PlayerEvent extends Listener {
	public constructor(context: Listener.Context, options: Listener.Options) {
		super(context, {
			...options,
			emitter: container.client.player.events,
			event: 'playerError'
		});
	}

	public run(queue: GuildQueue<{ channel: GuildTextBasedChannel }>, error: Error, track: Track) {
		const { emojis, voice } = container.client.utils;
		const permissions = voice(queue.metadata.channel);
		if (permissions.events) return;

		console.log(error);
		return queue.metadata.channel
			.send(`${emojis.error} | There was an error with **${track.title}**`)
			.then((m: { delete: () => void }) => setTimeout(() => m.delete(), 5000));
	}
}
