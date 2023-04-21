import { Listener } from '@sapphire/framework';

export class UserEvent extends Listener {
	public constructor(context: Listener.Context, options: Listener.Options) {
		super(context, {
			...options,
			once: true
		});
	}

	public async run() {
		await this.container.client.player.extractors.loadDefault();
		return this.container.client.logger.info(`Successfully logged in as: ${this.container.client.user?.username}`);
	}
}
