import { PoliceBot } from './core/bot';
import { Command } from './core/commands';
import { databaseSystem } from './core/database';
import { Callout } from './features/callout';
import { Character } from './features/character';
import { Division } from './features/division';
import { LogSystem } from './features/log';
import { TeamSpeakAPI } from './features/teamspeak';
import { Testing } from './features/testing';
import { TrainingFeature } from './features/training';

const features = [TrainingFeature, Character, Callout, Testing, TeamSpeakAPI];

(async () => {
	try {
		await databaseSystem.init();
		await PoliceBot.Init().then(async () => {
			await Division.Init();
			await TeamSpeakAPI.Init();
			await Character.Init();
			await Command.Init(features);
		});
	} catch(error) {
		LogSystem.Error('Init', error);
	}
})();

export class utils {
	static wait(time: number): Promise<void> {
		return new Promise<void>(resolve => {
			setTimeout(() => {
				resolve();
			}, time*1000);
		});
	}

	static waitUntil(check: boolean): Promise<void> {
		return new Promise<void>(resolve => {
			setInterval(() => {
				if(check === true) {
					resolve();
				}
			}, 2000);
		});
	}
}