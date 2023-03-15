import { BucketScope, LogLevel, SapphireClient } from '@sapphire/framework';
import { envParseArray } from '@skyra/env-utilities';
import { Player } from 'discord-player';
import { GatewayIntentBits } from 'discord.js';
import * as Utils from './lib/utils';

export class KarasuClient extends SapphireClient {
	public player: Player;
	public utils: typeof Utils;
	public constructor() {
		super({
			disableMentionPrefix: true,
			intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildVoiceStates],
			defaultCooldown: {
				filteredUsers: envParseArray('OWNERS'),
				scope: BucketScope.User,
				delay: 10_000,
				limit: 2
			},
			logger: {
				level: LogLevel.Info
			}
		});
		this.utils = Utils;
		this.player = Player.singleton(this);
	}
}

declare module 'discord.js' {
	interface Client {
		readonly player: Player;
		readonly utils: typeof Utils;
	}
}
