import { container, Listener } from '@sapphire/framework';
import type { GuildQueue } from 'discord-player';

export class PlayerEvent extends Listener {
	public constructor(context: Listener.LoaderContext, options: Listener.Options) {
		super(context, {
			...options,
			emitter: container.client.player.events,
			event: 'connectionError'
		});
	}

	public run(queue: GuildQueue, error: Error) {
		container.logger.error(`[${queue.guild.name}] Error emitted from the connection: ${error.message}`);
	}
}
