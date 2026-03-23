import { model, Schema, type Document, type Model } from 'mongoose'

export interface ITrack {
	title: string
	url: string
	author: string
	duration: string
	durationMS: number
	thumbnail?: string
	addedAt: Date
}

export interface IPlaylist extends Document {
	userId: string
	name: string
	description?: string
	tracks: ITrack[]
	createdAt: Date
	updatedAt: Date
}

const TrackSchema = new Schema<ITrack>(
	{
		title: { type: String, required: true },
		url: { type: String, required: true },
		author: { type: String, required: true },
		duration: { type: String, required: true },
		durationMS: { type: Number, required: true },
		thumbnail: String,
		addedAt: { type: Date, default: () => new Date() }
	},
	{ _id: false }
)

const PlaylistSchema = new Schema<IPlaylist>(
	{
		userId: { type: String, required: true },
		name: { type: String, required: true },
		description: String,
		tracks: { type: [TrackSchema], default: [] }
	},
	{ timestamps: true }
)

// Unique playlist names per user (case-sensitive at DB level — we handle case-insensitive checks in commands)
PlaylistSchema.index({ userId: 1, name: 1 }, { unique: true })
PlaylistSchema.index({ userId: 1 })

export const Playlist: Model<IPlaylist> = model('Playlist', PlaylistSchema)
