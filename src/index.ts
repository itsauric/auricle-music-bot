import { AuricleClient } from './AuricleClient';
import './lib/setup';
import { connectDatabase } from './lib/database';

const client = new AuricleClient();

const main = async () => {
	try {
		await connectDatabase();
		client.logger.info('Logging in...');
		return client.login();
	} catch (error) {
		client.logger.fatal(error);
		client.destroy();
		process.exit(1);
	}
};

void main();
