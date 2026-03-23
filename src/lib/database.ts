import { container } from '@sapphire/framework'
import mongoose from 'mongoose'

export async function connectDatabase() {
	const uri = process.env.MONGODB_URI
	if (!uri) throw new Error('MONGODB_URI is not defined — add it to your .env file')

	mongoose.connection.on('disconnected', () => container.logger.warn('MongoDB disconnected'))
	mongoose.connection.on('reconnected', () => container.logger.info('MongoDB reconnected'))

	await mongoose.connect(uri)
	container.logger.info('Connected to MongoDB')
}
