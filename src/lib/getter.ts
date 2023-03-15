import type { Command } from '@sapphire/framework';
import { cyan } from 'colorette';
import type { APIUser, Guild, User } from 'discord.js';

export function getShardInfo(id: number) {
	return `[${cyan(id.toString())}]`;
}

export function getCommandInfo(command: Command) {
	return cyan(command.name);
}

export function getAuthorInfo(author: User | APIUser) {
	return `${author.username}[${cyan(author.id)}]`;
}

export function getGuildInfo(guild: Guild | null) {
	if (guild === null) return 'Direct Messages';
	return `${guild.name}[${cyan(guild.id)}]`;
}
