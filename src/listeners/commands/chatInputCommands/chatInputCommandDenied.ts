import { DurationFormatter } from '@sapphire/duration';
import { MessageFlags } from 'discord.js';
import type { ChatInputCommandDeniedPayload, Events } from '@sapphire/framework';
import { Listener, UserError } from '@sapphire/framework';
import { makeEmbed } from '#lib/utils';

export class UserEvent extends Listener<typeof Events.ChatInputCommandDenied> {
	public run({ identifier, context, message: content }: UserError, { interaction }: ChatInputCommandDeniedPayload) {
		// `context: { silent: true }` should make UserError silent:
		// Use cases for this are for example permissions error when running the `eval` command.
		if (Reflect.get(Object(context), 'silent')) return;

		if (identifier === 'preconditionCooldown') {
			const remaining = Reflect.get(Object(context), 'remaining');
			const ms = new DurationFormatter().format(remaining);
			return interaction.reply({
				embeds: [makeEmbed(`⏳ | Slow down! Wait **${ms}** before using \`/${interaction.commandName}\` again`)],
				allowedMentions: { users: [interaction.user.id], roles: [] },
				flags: MessageFlags.Ephemeral
			});
		}

		return interaction.reply({
			embeds: [makeEmbed(content)],
			allowedMentions: { users: [interaction.user.id], roles: [] },
			flags: MessageFlags.Ephemeral
		});
	}
}
