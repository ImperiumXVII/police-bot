import { Message } from 'discord.js';
import { getRepository } from 'typeorm';
import { Character } from '..';
import { BaseCommand } from '../../../core/commands/base.command';
import { Command } from '../../../core/commands/options';
import { DiscordEntity } from '../../../entities/discord_user.entity';
import { LogSystem } from '../../log';

type NicknameCommandParams = {
	newname: string;
};

@Command<NicknameCommandParams>({
	name: ['nick', 'setname', 'setnick', 'name', 'nickname'],
	channel: ['user-changes', 'bot-testing'],
	params: {
		newname: {
			validator: 'string',
			hint: 'new character name',
		},
	},
})
export class NicknameCommand extends BaseCommand {
	async run(user: DiscordEntity, message: Message, params: NicknameCommandParams): Promise<void> {
		const memberRepository = getRepository(DiscordEntity);

		message.author.send(`Your nickname has been changed from ${user.character} to ${params.newname}`).catch((e) => {
			LogSystem.Error('Character', e.message);
		});

		user.character = params.newname.replace('_', ' ');
		await memberRepository.save(user);

		if (message.channel.type !== 'DM') {
			message.delete().catch((e) => {
				LogSystem.Error('Character', e.message);
			});
		}

		Character.LoadFactionMembers();
	}
}
