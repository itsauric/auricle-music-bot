import { AuricleClient } from './AuricleClient';
import './lib/setup';

const client = new AuricleClient();

const main = async () => {
	try {
		client.logger.info('Logging in...');
		return client.login();
	} catch (error) {
		client.logger.fatal(error);
		client.destroy();
		process.exit(1);
	}
};

void main();
