import { Message } from 'discord.js';
import { getRepository } from 'typeorm';
import { BaseCommand } from '../../../core/commands/base.command';
import { Command } from '../../../core/commands/options';
import { DiscordEntity } from '../../../entities/discord_user.entity';

type GetPermsCommandParams = {
	character: string;
};

@Command<GetPermsCommandParams>({
	name: 'getperms',
	channel: 'bot-testing',
	params: {
		character: {
			validator: 'user',
			hint: 'character name/serial number/OOC name',
		},
	},
})
export class GetPermsCommand extends BaseCommand {
	async run(user: DiscordEntity, message: Message, params: GetPermsCommandParams): Promise<void> {
		const target = params.character;
		const repo = getRepository(DiscordEntity);
		// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
		const char = (await repo.findOne({ character: target }))!;
		await message.channel.send(`Permissions of ${char.character}:\n\t${char.roles.join('\n\t')}`);
	}
}
