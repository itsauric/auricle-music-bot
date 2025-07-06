import type { ChatInputCommandSuccessPayload, Command, ContextMenuCommandSuccessPayload, MessageCommandSuccessPayload } from '@sapphire/framework';
import { container } from '@sapphire/framework';
import { cyan } from 'colorette';
import { Guild, GuildMember, GuildTextBasedChannel, Interaction, PermissionsBitField, User } from 'discord.js';

interface VoiceResult1 {
	client: string | undefined;
	member: string | undefined;
	clientToMember: string | undefined;
}

interface VoiceResult2 {
	events: number;
}

function isGuildTextBasedChannel(interaction: Command.ChatInputCommandInteraction | GuildTextBasedChannel): interaction is GuildTextBasedChannel {
	if ('applicationId' in interaction) return false;
	return true;
}
export function voice(interaction: Command.ChatInputCommandInteraction): VoiceResult1;
export function voice(interaction: GuildTextBasedChannel): VoiceResult2;

export function voice(interaction: Command.ChatInputCommandInteraction | GuildTextBasedChannel) {
	if (isGuildTextBasedChannel(interaction)) {
		return {
			get events() {
				const resolved = new PermissionsBitField([PermissionsBitField.Flags.SendMessages, PermissionsBitField.Flags.ViewChannel]);
				const missingPerms = interaction.permissionsFor(interaction.guild!.members.me!).missing(resolved);
				return missingPerms.length;
			}
		};
	}

	const interactionMember = interaction.member as GuildMember;
	return {
		get member() {
			if (!interactionMember.voice.channel) return `${emojis.error} | You **need** to be in a voice channel.`;
		},
		get client() {
			const resolved = new PermissionsBitField([
				PermissionsBitField.Flags.Connect,
				PermissionsBitField.Flags.Speak,
				PermissionsBitField.Flags.ViewChannel
			]);
			const missingPerms = interactionMember.voice.channel!.permissionsFor(interaction.guild!.members.me!).missing(resolved);

			if (missingPerms.length)
				return `${emojis.error} | I am **missing** the required voice channel permissions: \`${missingPerms.join(', ')}\``;
		},
		get clientToMember() {
			if (
				interaction.guild?.members.me?.voice.channelId &&
				interactionMember.voice.channelId !== interaction.guild?.members.me?.voice.channelId
			)
				return `${emojis.error} | You are **not** in my voice channel`;
		}
	};
}

export function options(interaction: Interaction) {
	return {
		metadata: {
			channel: interaction.channel,
			client: interaction.guild?.members.me
		},
		leaveOnEmptyCooldown: 300000,
		leaveOnEmpty: true,
		leaveOnEnd: false,
		bufferingTimeout: 0,
		selfDeaf: true
	};
}

export const emojis = {
	get success() {
		return '<:passed:1391120068603281478>';
	},
	get error() {
		return '<:failed:1391120127054975106>';
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

function getSuccessLoggerData(guild: Guild | null, user: User, command: Command) {
	const shard = `[${cyan(guild?.shardId || 0).toString()}]`;
	const commandName = cyan(command.name);
	const author = `${user.username}[${cyan(user.id)}]`;
	const sentAt = guild ? `${guild.name}[${cyan(guild.id)}]` : 'Direct Messages';

	return { shard, commandName, author, sentAt };
}
