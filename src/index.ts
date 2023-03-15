import { KarasuClient } from './KarasuClient';
import './lib/setup';

const client = new KarasuClient();

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
