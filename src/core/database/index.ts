import { Connection, createConnection } from 'typeorm';
import { LogSystem } from '../../features/log';

export class DatabaseSystem {
	connection?: Connection | void;
	attempts = 0;

	async init(): Promise<void> {
		do {
			try {
				if (this.connection) {
					await this.connection.connect();
				} else {
					this.connection = await createConnection();
				}
			} catch (error) {
				if (this.attempts < 5) {
					LogSystem.Error('Database', 'Database connection unsuccessful, retrying ...', error);
					this.attempts++;
				} else {
					LogSystem.Error('Database', 'Database connection unsuccessful', error);
					process.exit();
				}
			}
		} while (!this.connection);

		LogSystem.Log('Database', 'Connection successful.');
	}
}

export const databaseSystem = new DatabaseSystem();
