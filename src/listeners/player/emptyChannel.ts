import { container, Listener } from '@sapphire/framework';
import type { GuildQueue } from 'discord-player';
import type { GuildTextBasedChannel } from 'discord.js';

export class PlayerEvent extends Listener {
	public constructor(context: Listener.LoaderContext, options: Listener.Options) {
		super(context, {
			...options,
			emitter: container.client.player.events,
			event: 'emptyChannel'
		});
	}

	public run(queue: GuildQueue<{ channel: GuildTextBasedChannel }>) {
		const { voice } = container.client.utils;
		const permissions = voice(queue.metadata.channel);
		if (permissions.events) return;

		return queue.metadata.channel
			.send('I left the channel after **5 minutes** due to **channel inactivity**')
			.then((m: { delete: () => void }) => setTimeout(() => m.delete(), 15000));
	}
}
