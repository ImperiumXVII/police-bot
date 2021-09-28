import { Message } from 'discord.js';
import { getRepository } from 'typeorm';
import { AlternateCharacter, Character } from '..';
import { BaseCommand } from '../../../core/commands/base.command';
import { Command } from '../../../core/commands/options';
import { DiscordEntity } from '../../../entities/discord_user.entity';

type AddAltCommandParams = {
	name: string;
	serial: number;
	rank: string;
};

@Command<AddAltCommandParams>({
	name: 'addalt',
	channel: ['user-changes', 'bot-testing'],
	guard: {
		groups: ['396710275576889344', '396710223278243860'],
	},
	params: {
		name: {
			validator: 'word',
			hint: 'character name',
		},
		serial: {
			validator: 'number',
			hint: 'serial number (0 for none)',
		},
		rank: {
			validator: 'string',
			hint: 'character rank',
		},
	},
})
export class AddAltCommand extends BaseCommand {
	async run(user: DiscordEntity, message: Message, params: AddAltCommandParams): Promise<void> {
		if (!params.name.includes('_')) {
			message.channel.send('Invalid parameter: character name must include an underscore (`_`)');
			return;
		}
		if (!user.alternates) {
			user.alternates = [];
		}
		const newEntry: AlternateCharacter = {
			name: params.name.replace(/_/g, ' '),
			rank: params.rank,
			serial: params.serial !== 0 ? params.serial : null,
		};
		user.alternates.push(newEntry);
		const userRepository = getRepository(DiscordEntity);
		await userRepository.save(user).then(() => {
			message.channel.send(`Added alternate character ${params.rank} ${params.name} to ${user.character}'s profile.`);
		});

		Character.LoadFactionMembers();
	}
}
