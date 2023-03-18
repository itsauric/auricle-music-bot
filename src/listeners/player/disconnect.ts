import { container, Listener } from '@sapphire/framework';
import type { GuildQueue } from 'discord-player';
import type { GuildTextBasedChannel } from 'discord.js';

export class PlayerEvent extends Listener {
	public constructor(context: Listener.Context, options: Listener.Options) {
		super(context, {
			...options,
			emitter: container.client.player.events,
			event: 'disconnect'
		});
	}

	public run(queue: GuildQueue<{ channel: GuildTextBasedChannel }>) {
		const { voice } = container.client.utils;
		const permissions = voice(queue.metadata.channel);
		if (permissions.events) return;

		return queue.metadata.channel
			.send('I have been **manually disconnected** from the **voice channel**')
			.then((m: { delete: () => void }) => setTimeout(() => m.delete(), 15000));
	}
}
