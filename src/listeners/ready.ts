import { Listener } from '@sapphire/framework';
import { DefaultExtractors } from '@discord-player/extractor';

export class UserEvent extends Listener {
	public constructor(context: Listener.LoaderContext, options: Listener.Options) {
		super(context, {
			...options,
			once: true
		});
	}

	public async run() {
		await this.container.client.player.extractors.loadMulti(DefaultExtractors);
		return this.container.client.logger.info(`Successfully logged in as: ${this.container.client.user?.username}`);
	}
}
