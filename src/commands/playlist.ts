import { PaginatedMessage } from '@sapphire/discord.js-utilities'
import { Subcommand } from '@sapphire/plugin-subcommands'
import { QueryType, Track, useMainPlayer, useQueue } from 'discord-player'
import { EmbedBuilder, GuildMember, MessageFlags } from 'discord.js'
import { BRAND_COLOR, makeEmbed } from '#lib/utils'
import { Playlist } from '#lib/schemas/Playlist'

const MAX_PLAYLISTS = 25
const MAX_TRACKS = 200
const NAME_REGEX = /^[\w\s-]{1,50}$/

function escapeRegex(str: string) {
	return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

export class PlaylistCommand extends Subcommand {
	public constructor(context: Subcommand.LoaderContext, options: Subcommand.Options) {
		super(context, {
			...options,
			description: 'Manage your personal playlists',
			subcommands: [
				{ name: 'create', chatInputRun: 'chatInputCreate' },
				{ name: 'delete', chatInputRun: 'chatInputDelete' },
				{ name: 'rename', chatInputRun: 'chatInputRename' },
				{ name: 'list', chatInputRun: 'chatInputList' },
				{ name: 'view', chatInputRun: 'chatInputView' },
				{ name: 'add', chatInputRun: 'chatInputAdd' },
				{ name: 'remove', chatInputRun: 'chatInputRemove' },
				{ name: 'clear', chatInputRun: 'chatInputClear' },
				{ name: 'play', chatInputRun: 'chatInputPlay' },
				{ name: 'save-queue', chatInputRun: 'chatInputSaveQueue' }
			]
		})
	}

	public override registerApplicationCommands(registry: Subcommand.Registry) {
		registry.registerChatInputCommand((builder) =>
			builder
				.setName(this.name)
				.setDescription(this.description)
				.addSubcommand((sub) =>
					sub
						.setName('create')
						.setDescription('Create a new playlist')
						.addStringOption((o) =>
							o.setName('name').setDescription('Playlist name (letters, numbers, spaces, hyphens — max 50 chars)').setRequired(true).setMaxLength(50)
						)
						.addStringOption((o) => o.setName('description').setDescription('Optional description').setRequired(false).setMaxLength(100))
				)
				.addSubcommand((sub) =>
					sub
						.setName('delete')
						.setDescription('Permanently delete a playlist')
						.addStringOption((o) => o.setName('name').setDescription('Playlist to delete').setRequired(true).setAutocomplete(true))
				)
				.addSubcommand((sub) =>
					sub
						.setName('rename')
						.setDescription('Rename a playlist')
						.addStringOption((o) => o.setName('name').setDescription('Playlist to rename').setRequired(true).setAutocomplete(true))
						.addStringOption((o) =>
							o.setName('new-name').setDescription('New name for the playlist').setRequired(true).setMaxLength(50)
						)
				)
				.addSubcommand((sub) => sub.setName('list').setDescription('View all your playlists'))
				.addSubcommand((sub) =>
					sub
						.setName('view')
						.setDescription('View all tracks in a playlist')
						.addStringOption((o) => o.setName('name').setDescription('Playlist to view').setRequired(true).setAutocomplete(true))
				)
				.addSubcommand((sub) =>
					sub
						.setName('add')
						.setDescription('Add a track or playlist URL to a playlist')
						.addStringOption((o) => o.setName('name').setDescription('Playlist to add to').setRequired(true).setAutocomplete(true))
						.addStringOption((o) =>
							o.setName('query').setDescription('Track to add (search or URL)').setRequired(true).setAutocomplete(true)
						)
				)
				.addSubcommand((sub) =>
					sub
						.setName('remove')
						.setDescription('Remove a track from a playlist by position')
						.addStringOption((o) =>
							o.setName('name').setDescription('Playlist to remove from').setRequired(true).setAutocomplete(true)
						)
						.addIntegerOption((o) =>
							o
								.setName('position')
								.setDescription('Track position to remove (see /playlist view for positions)')
								.setRequired(true)
								.setMinValue(1)
						)
				)
				.addSubcommand((sub) =>
					sub
						.setName('clear')
						.setDescription('Remove all tracks from a playlist')
						.addStringOption((o) => o.setName('name').setDescription('Playlist to clear').setRequired(true).setAutocomplete(true))
				)
				.addSubcommand((sub) =>
					sub
						.setName('play')
						.setDescription('Queue an entire playlist')
						.addStringOption((o) => o.setName('name').setDescription('Playlist to play').setRequired(true).setAutocomplete(true))
				)
				.addSubcommand((sub) =>
					sub
						.setName('save-queue')
						.setDescription('Save the current queue as a new playlist')
						.addStringOption((o) =>
							o.setName('name').setDescription('Name for the new playlist').setRequired(true).setMaxLength(50)
						)
				)
		)
	}

	public override async autocompleteRun(interaction: Subcommand.AutocompleteInteraction) {
		const focused = interaction.options.getFocused(true)

		// Autocomplete playlist name from user's own playlists
		if (focused.name === 'name') {
			const query = focused.value.toLowerCase()
			const playlists = await Playlist.find({ userId: interaction.user.id }).select('name').lean()
			const filtered = playlists
				.filter((p) => p.name.toLowerCase().includes(query))
				.map((p) => ({ name: p.name, value: p.name }))
				.slice(0, 25)
			return interaction.respond(filtered).catch(() => null)
		}

		// Autocomplete track search for /playlist add
		if (focused.name === 'query') {
			const query = focused.value.trim()
			if (!query) return interaction.respond([]).catch(() => null)
			try {
				const player = useMainPlayer()!
				const searchEngine = query.startsWith('http') ? undefined : QueryType.SOUNDCLOUD_SEARCH
				const results = await player.search(query, { searchEngine })
				const tracks = results.tracks.map((t) => ({ name: t.title.slice(0, 100), value: t.url })).slice(0, 5)
				return interaction.respond(tracks).catch(() => null)
			} catch {
				return interaction.respond([]).catch(() => null)
			}
		}
	}

	public async chatInputCreate(interaction: Subcommand.ChatInputCommandInteraction) {
		const { emojis } = this.container.client.utils
		const userId = interaction.user.id
		const name = interaction.options.getString('name', true).trim()
		const description = interaction.options.getString('description')?.trim()

		if (!NAME_REGEX.test(name))
			return interaction.reply({
				embeds: [makeEmbed(`${emojis.error} | Playlist name can only contain **letters, numbers, spaces, and hyphens**`)],
				flags: MessageFlags.Ephemeral
			})

		const count = await Playlist.countDocuments({ userId })
		if (count >= MAX_PLAYLISTS)
			return interaction.reply({
				embeds: [makeEmbed(`${emojis.error} | You have reached the **${MAX_PLAYLISTS} playlist** limit`)],
				flags: MessageFlags.Ephemeral
			})

		const existing = await Playlist.findOne({ userId, name: { $regex: new RegExp(`^${escapeRegex(name)}$`, 'i') } })
		if (existing)
			return interaction.reply({
				embeds: [makeEmbed(`${emojis.error} | You already have a playlist named **${name}**`)],
				flags: MessageFlags.Ephemeral
			})

		await Playlist.create({ userId, name, description })

		return interaction.reply({
			embeds: [makeEmbed(`${emojis.playlist} | Playlist **${name}** has been **created**`)],
			flags: MessageFlags.Ephemeral
		})
	}

	public async chatInputDelete(interaction: Subcommand.ChatInputCommandInteraction) {
		const { emojis } = this.container.client.utils
		const userId = interaction.user.id
		const name = interaction.options.getString('name', true)

		const playlist = await Playlist.findOneAndDelete({ userId, name })
		if (!playlist)
			return interaction.reply({
				embeds: [makeEmbed(`${emojis.error} | No playlist named **${name}** was found`)],
				flags: MessageFlags.Ephemeral
			})

		return interaction.reply({
			embeds: [makeEmbed(`${emojis.playlist} | Playlist **${name}** has been **deleted**`)],
			flags: MessageFlags.Ephemeral
		})
	}

	public async chatInputRename(interaction: Subcommand.ChatInputCommandInteraction) {
		const { emojis } = this.container.client.utils
		const userId = interaction.user.id
		const name = interaction.options.getString('name', true)
		const newName = interaction.options.getString('new-name', true).trim()

		if (!NAME_REGEX.test(newName))
			return interaction.reply({
				embeds: [makeEmbed(`${emojis.error} | Playlist name can only contain **letters, numbers, spaces, and hyphens**`)],
				flags: MessageFlags.Ephemeral
			})

		const conflict = await Playlist.findOne({ userId, name: { $regex: new RegExp(`^${escapeRegex(newName)}$`, 'i') } })
		if (conflict)
			return interaction.reply({
				embeds: [makeEmbed(`${emojis.error} | You already have a playlist named **${newName}**`)],
				flags: MessageFlags.Ephemeral
			})

		const playlist = await Playlist.findOneAndUpdate({ userId, name }, { $set: { name: newName } })
		if (!playlist)
			return interaction.reply({
				embeds: [makeEmbed(`${emojis.error} | No playlist named **${name}** was found`)],
				flags: MessageFlags.Ephemeral
			})

		return interaction.reply({
			embeds: [makeEmbed(`${emojis.playlist} | **${name}** has been renamed to **${newName}**`)],
			flags: MessageFlags.Ephemeral
		})
	}

	public async chatInputList(interaction: Subcommand.ChatInputCommandInteraction) {
		const { emojis } = this.container.client.utils
		const userId = interaction.user.id

		const playlists = await Playlist.find({ userId }).select('name description tracks').lean()

		if (!playlists.length)
			return interaction.reply({
				embeds: [
					makeEmbed(`${emojis.playlist} | You have **no playlists** yet — use \`/playlist create\` to make one`)
				],
				flags: MessageFlags.Ephemeral
			})

		const embed = new EmbedBuilder()
			.setColor(BRAND_COLOR)
			.setAuthor({ name: `${interaction.user.displayName}'s Playlists`, iconURL: interaction.user.displayAvatarURL() })
			.setDescription(
				playlists
					.map(
						(p, i) =>
							`**${i + 1}.** ${p.name} — ${p.tracks.length} track${p.tracks.length !== 1 ? 's' : ''}${p.description ? `\n${' '.repeat(4)}*${p.description}*` : ''}`
					)
					.join('\n')
			)
			.setFooter({ text: `${playlists.length}/${MAX_PLAYLISTS} playlists` })

		return interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral })
	}

	public async chatInputView(interaction: Subcommand.ChatInputCommandInteraction) {
		const { emojis } = this.container.client.utils
		const userId = interaction.user.id
		const name = interaction.options.getString('name', true)

		const playlist = await Playlist.findOne({ userId, name }).lean()
		if (!playlist)
			return interaction.reply({
				embeds: [makeEmbed(`${emojis.error} | No playlist named **${name}** was found`)],
				flags: MessageFlags.Ephemeral
			})

		if (!playlist.tracks.length)
			return interaction.reply({
				embeds: [
					new EmbedBuilder()
						.setColor(BRAND_COLOR)
						.setTitle(name)
						.setDescription('*This playlist is empty — use `/playlist add` to add some tracks*')
				],
				flags: MessageFlags.Ephemeral
			})

		const TRACKS_PER_PAGE = 10
		const pagesNum = Math.ceil(playlist.tracks.length / TRACKS_PER_PAGE)
		const paginatedMessage = new PaginatedMessage()

		for (let i = 0; i < pagesNum; i++) {
			const slice = playlist.tracks.slice(i * TRACKS_PER_PAGE, i * TRACKS_PER_PAGE + TRACKS_PER_PAGE)
			const list = slice
				.map(
					(t, j) =>
						`**${i * TRACKS_PER_PAGE + j + 1}.** [${t.title}](${t.url})\n${' '.repeat(4)}\`${t.duration}\` — ${t.author}`
				)
				.join('\n')

			paginatedMessage.addPageEmbed((embed) =>
				embed
					.setColor(BRAND_COLOR)
					.setTitle(name)
					.setDescription(list)
					.setFooter({
						text: `${playlist.tracks.length} track${playlist.tracks.length !== 1 ? 's' : ''}  •  Page ${i + 1}/${pagesNum}`
					})
			)
		}

		return paginatedMessage.run(interaction)
	}

	public async chatInputAdd(interaction: Subcommand.ChatInputCommandInteraction) {
		const { emojis } = this.container.client.utils
		const userId = interaction.user.id
		const name = interaction.options.getString('name', true)
		const query = interaction.options.getString('query', true).trim()

		const playlist = await Playlist.findOne({ userId, name })
		if (!playlist)
			return interaction.reply({
				embeds: [makeEmbed(`${emojis.error} | No playlist named **${name}** was found`)],
				flags: MessageFlags.Ephemeral
			})

		if (playlist.tracks.length >= MAX_TRACKS)
			return interaction.reply({
				embeds: [makeEmbed(`${emojis.error} | **${name}** is full (**${MAX_TRACKS}** track maximum)`)],
				flags: MessageFlags.Ephemeral
			})

		await interaction.deferReply()

		try {
			const player = useMainPlayer()!
			const searchEngine = query.startsWith('http') ? undefined : QueryType.YOUTUBE_SEARCH
			const results = await player.search(query, { searchEngine })

			if (!results.tracks.length)
				return interaction.editReply({ embeds: [makeEmbed(`${emojis.error} | No results found for **${query}**`)] })

			// Handle playlist URLs — bulk add up to remaining capacity
			if (results.playlist) {
				const remaining = MAX_TRACKS - playlist.tracks.length
				const toAdd = results.tracks.slice(0, remaining).map((t) => ({
					title: t.title,
					url: t.url,
					author: t.author,
					duration: t.duration,
					durationMS: t.durationMS,
					thumbnail: t.thumbnail,
					addedAt: new Date()
				}))

				await playlist.updateOne({ $push: { tracks: { $each: toAdd } } })

				const truncated = results.tracks.length - toAdd.length
				return interaction.editReply({
					embeds: [
						makeEmbed(
							`${emojis.enqueue} | Added **${toAdd.length}** track${toAdd.length !== 1 ? 's' : ''} from **${results.playlist.title}** to **${name}**${truncated > 0 ? `\n*${truncated} track(s) omitted — playlist is now full*` : ''}`
						)
					]
				})
			}

			const track = results.tracks[0]

			if (playlist.tracks.some((t) => t.url === track.url))
				return interaction.editReply({
					embeds: [makeEmbed(`${emojis.warning} | **${track.title}** is already in **${name}**`)]
				})

			await playlist.updateOne({
				$push: {
					tracks: {
						title: track.title,
						url: track.url,
						author: track.author,
						duration: track.duration,
						durationMS: track.durationMS,
						thumbnail: track.thumbnail,
						addedAt: new Date()
					}
				}
			})

			return interaction.editReply({
				embeds: [makeEmbed(`${emojis.enqueue} | Added **${track.title}** to **${name}**`)]
			})
		} catch {
			return interaction.editReply({
				embeds: [makeEmbed(`${emojis.error} | Failed to find that track — please try again`)]
			})
		}
	}

	public async chatInputRemove(interaction: Subcommand.ChatInputCommandInteraction) {
		const { emojis } = this.container.client.utils
		const userId = interaction.user.id
		const name = interaction.options.getString('name', true)
		const position = interaction.options.getInteger('position', true)

		const playlist = await Playlist.findOne({ userId, name })
		if (!playlist)
			return interaction.reply({
				embeds: [makeEmbed(`${emojis.error} | No playlist named **${name}** was found`)],
				flags: MessageFlags.Ephemeral
			})

		if (position > playlist.tracks.length)
			return interaction.reply({
				embeds: [
					makeEmbed(
						`${emojis.error} | Position **${position}** is out of range — **${name}** has **${playlist.tracks.length}** track${playlist.tracks.length !== 1 ? 's' : ''}`
					)
				],
				flags: MessageFlags.Ephemeral
			})

		const removed = playlist.tracks[position - 1]
		playlist.tracks.splice(position - 1, 1)
		await playlist.save()

		return interaction.reply({
			embeds: [makeEmbed(`${emojis.remove} | Removed **${removed.title}** from **${name}**`)]
		})
	}

	public async chatInputClear(interaction: Subcommand.ChatInputCommandInteraction) {
		const { emojis } = this.container.client.utils
		const userId = interaction.user.id
		const name = interaction.options.getString('name', true)

		const playlist = await Playlist.findOneAndUpdate({ userId, name }, { $set: { tracks: [] } })
		if (!playlist)
			return interaction.reply({
				embeds: [makeEmbed(`${emojis.error} | No playlist named **${name}** was found`)],
				flags: MessageFlags.Ephemeral
			})

		return interaction.reply({
			embeds: [makeEmbed(`${emojis.clear} | All tracks cleared from **${name}**`)]
		})
	}

	public async chatInputPlay(interaction: Subcommand.ChatInputCommandInteraction) {
		const { emojis, voice, options } = this.container.client.utils
		const userId = interaction.user.id
		const name = interaction.options.getString('name', true)
		const permissions = voice(interaction)

		if (permissions.member) return interaction.reply({ embeds: [makeEmbed(permissions.member)], flags: MessageFlags.Ephemeral })
		if (permissions.client) return interaction.reply({ embeds: [makeEmbed(permissions.client)], flags: MessageFlags.Ephemeral })
		if (permissions.clientToMember) return interaction.reply({ embeds: [makeEmbed(permissions.clientToMember)], flags: MessageFlags.Ephemeral })

		const playlist = await Playlist.findOne({ userId, name }).lean()
		if (!playlist)
			return interaction.reply({
				embeds: [makeEmbed(`${emojis.error} | No playlist named **${name}** was found`)],
				flags: MessageFlags.Ephemeral
			})

		if (!playlist.tracks.length)
			return interaction.reply({
				embeds: [makeEmbed(`${emojis.error} | **${name}** is empty — add tracks with \`/playlist add\``)],
				flags: MessageFlags.Ephemeral
			})

		await interaction.deferReply()

		const player = useMainPlayer()!
		const voiceChannel = (interaction.member as GuildMember).voice.channel!

		// Play the first track to initialise the queue
		try {
			await player.play(voiceChannel, playlist.tracks[0].url, { nodeOptions: options(interaction) })
		} catch {
			return interaction.editReply({
				embeds: [makeEmbed(`${emojis.error} | Failed to start playback — the first track may be unavailable`)]
			})
		}

		const queue = useQueue(interaction.guild!.id)!

		// Add remaining tracks directly to avoid N individual search calls
		for (const t of playlist.tracks.slice(1)) {
			const track = new Track(player, {
				title: t.title,
				url: t.url,
				author: t.author,
				duration: t.duration,
				thumbnail: t.thumbnail ?? '',
				requestedBy: interaction.user,
				source: 'arbitrary',
				queryType: QueryType.ARBITRARY
			})
			queue.addTrack(track)
		}

		return interaction.editReply({
			embeds: [
				makeEmbed(
					`${emojis.play} | Queued **${playlist.tracks.length}** track${playlist.tracks.length !== 1 ? 's' : ''} from **${name}**`
				)
			]
		})
	}

	public async chatInputSaveQueue(interaction: Subcommand.ChatInputCommandInteraction) {
		const { emojis } = this.container.client.utils
		const userId = interaction.user.id
		const name = interaction.options.getString('name', true).trim()

		if (!NAME_REGEX.test(name))
			return interaction.reply({
				embeds: [makeEmbed(`${emojis.error} | Playlist name can only contain **letters, numbers, spaces, and hyphens**`)],
				flags: MessageFlags.Ephemeral
			})

		const queue = useQueue(interaction.guild!.id)
		if (!queue?.currentTrack)
			return interaction.reply({
				embeds: [makeEmbed(`${emojis.error} | There is nothing currently playing`)],
				flags: MessageFlags.Ephemeral
			})

		const count = await Playlist.countDocuments({ userId })
		if (count >= MAX_PLAYLISTS)
			return interaction.reply({
				embeds: [makeEmbed(`${emojis.error} | You have reached the **${MAX_PLAYLISTS} playlist** limit`)],
				flags: MessageFlags.Ephemeral
			})

		const existing = await Playlist.findOne({ userId, name: { $regex: new RegExp(`^${escapeRegex(name)}$`, 'i') } })
		if (existing)
			return interaction.reply({
				embeds: [makeEmbed(`${emojis.error} | You already have a playlist named **${name}**`)],
				flags: MessageFlags.Ephemeral
			})

		const tracks = [queue.currentTrack, ...queue.tracks.toArray()].slice(0, MAX_TRACKS).map((t) => ({
			title: t.title,
			url: t.url,
			author: t.author,
			duration: t.duration,
			durationMS: t.durationMS,
			thumbnail: t.thumbnail,
			addedAt: new Date()
		}))

		await Playlist.create({ userId, name, tracks })

		return interaction.reply({
			embeds: [
				makeEmbed(
					`${emojis.save} | Saved **${tracks.length}** track${tracks.length !== 1 ? 's' : ''} from the queue to **${name}**`
				)
			]
		})
	}
}
