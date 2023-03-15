import type { ChatInputCommandSuccessPayload, Command, ContextMenuCommandSuccessPayload, MessageCommandSuccessPayload } from '@sapphire/framework';
import { container } from '@sapphire/framework';
import { Guild, PermissionsBitField, User } from 'discord.js';
import { getAuthorInfo, getCommandInfo, getGuildInfo, getShardInfo } from './getter';

export function voice(interaction) {
	const functions = {
		get client() {
			const resolved = new PermissionsBitField([
				PermissionsBitField.Flags.Connect,
				PermissionsBitField.Flags.Speak,
				PermissionsBitField.Flags.ViewChannel
			]);
			const missingPerms = interaction.member.voice.channel.permissionsFor(interaction.guild!.members.me!).missing(resolved);

			if (missingPerms.length)
				return `${emojis.error} | I am **missing** the required voice channel permissions: \`${missingPerms.join(', ')}\``;
		},

		get member() {
			if (!interaction.member.voice.channel) return `${emojis.error} | You **need** to be in a voice channel.`;
		},

		get clientToMember() {
			if (
				interaction.guild?.members.me?.voice.channelId &&
				interaction.member.voice.channelId !== interaction.guild?.members.me?.voice.channelId
			)
				return `${emojis.error} | You are **not** in my voice channel`;
		}
	};
	return functions;
}

export const emojis = {
	get success() {
		return '<:success:1073378190321516635>';
	},
	get error() {
		return '<:error:1073378188048211999>';
	}
};

export function logSuccessCommand(payload: ContextMenuCommandSuccessPayload | ChatInputCommandSuccessPayload | MessageCommandSuccessPayload): void {
	let successLoggerData: ReturnType<typeof getSuccessLoggerData>;

	if ('interaction' in payload) {
		successLoggerData = getSuccessLoggerData(payload.interaction.guild, payload.interaction.user, payload.command);
	} else {
		successLoggerData = getSuccessLoggerData(payload.message.guild, payload.message.author, payload.command);
	}

	container.logger.debug(`${successLoggerData.shard} - ${successLoggerData.commandName} ${successLoggerData.author} ${successLoggerData.sentAt}`);
}

export function getSuccessLoggerData(guild: Guild | null, user: User, command: Command) {
	const shard = getShardInfo(guild?.shardId ?? 0);
	const commandName = getCommandInfo(command);
	const author = getAuthorInfo(user);
	const sentAt = getGuildInfo(guild);

	return { shard, commandName, author, sentAt };
}
