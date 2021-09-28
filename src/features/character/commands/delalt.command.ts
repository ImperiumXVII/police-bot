import { Message } from 'discord.js';
import { getRepository } from 'typeorm';
import { Character } from '..';
import { BaseCommand } from '../../../core/commands/base.command';
import { Command } from '../../../core/commands/options';
import { DiscordEntity } from '../../../entities/discord_user.entity';

type DelAltCommandParams = {
	name: string;
};

@Command<DelAltCommandParams>({
	name: 'delalt',
	channel: ['user-changes', 'bot-testing'],
	guard: {
		groups: ['396710275576889344', '396710223278243860'],
	},
	params: {
		name: {
			validator: 'string',
			hint: 'character name',
		},
	},
})
export class DelAltCommand extends BaseCommand {
	async run(user: DiscordEntity, message: Message, params: DelAltCommandParams): Promise<void> {
		if (params.name.includes('_')) {
			params.name = params.name.replace(/_/g, ' ');
		}
		if (!user.alternates) {
			message.channel.send('You do not have any alternate characters.');
			return;
		}
		const altChar = user.alternates.find((c) => c.name === params.name);
		if (!altChar) {
			message.channel.send('You do not have any alternate characters with the name ' + params.name + '.');
			return;
		}
		user.alternates.splice(
			user.alternates.findIndex((char) => char === altChar),
			1,
		);
		const userRepository = getRepository(DiscordEntity);
		await userRepository.save(user).then(() => {
			message.channel.send(`Removed alternate character ${altChar.rank} ${altChar.name} from ${user.character}'s profile.`);
		});

		Character.LoadFactionMembers();
	}
}
