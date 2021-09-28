import { Message } from 'discord.js';
import { getRepository } from 'typeorm';
import { Character } from '..';
import { BaseCommand } from '../../../core/commands/base.command';
import { Command } from '../../../core/commands/options';
import { DiscordEntity } from '../../../entities/discord_user.entity';
import { rankNames } from '../../../environment';
import { LogSystem } from '../../log';

type RankCommandParams = {
	newrank: string;
};

@Command<RankCommandParams>({
	name: 'rank',
	channel: ['user-changes', 'bot-testing'],
	params: {
		newrank: {
			validator: 'string',
			hint: 'new rank',
			mustBe: rankNames,
		},
	},
})
export class RankCommand extends BaseCommand {
	async run(user: DiscordEntity, message: Message, params: RankCommandParams): Promise<void> {
		const memberRepository = getRepository(DiscordEntity);

		message.author.send(`Your rank has been changed from ${user.rank} to ${params.newrank}`).catch((e) => {
			LogSystem.Error('Character', e.message);
		});

		user.rank = params.newrank;
		await memberRepository.save(user);

		if (message.channel.type !== 'DM') {
			message.delete().catch((e) => {
				LogSystem.Error('Character', e.message);
			});
		}

		Character.LoadFactionMembers();
	}
}
