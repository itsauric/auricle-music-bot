import { BucketScope, LogLevel, SapphireClient } from '@sapphire/framework';
import { envParseArray } from '@skyra/env-utilities';
import { Player } from 'discord-player';
import { GatewayIntentBits } from 'discord.js';
import { RadioPlayer } from '@auric/radio';
import Emojis from './emojis';
import * as Permissions from './lib/perms';

export class KarasuClient extends SapphireClient {
	public player: Player;
	public radio: RadioPlayer;
	public dev: typeof Emojis;
	public perms: typeof Permissions;
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
				level: LogLevel.Error
			}
		});
		this.dev = Emojis;
		this.perms = Permissions;
		this.player = new Player(this);
		this.radio = new RadioPlayer();
	}
}

declare module 'discord.js' {
	interface Client {
		readonly player: Player;
		readonly radio: RadioPlayer;
		readonly perms: typeof Permissions;
		readonly dev: typeof Emojis;
	}
}
