import { Message } from 'discord.js';
import { Character } from '..';
import { BaseCommand } from '../../../core/commands/base.command';
import { Command } from '../../../core/commands/options';
import { DiscordEntity } from '../../../entities/discord_user.entity';
import { LogSystem } from '../../log';

@Command({
	name: 'updateusers',
	channel: ['user-changes', 'bot-testing'],
	guard: {
		groups: ['396710275576889344', '396710223278243860'],
	},
})
export class UpdateUsersCommand extends BaseCommand {
	async run(user: DiscordEntity, message: Message): Promise<void> {
		const updateLog = await message.channel.send('Updating user list...');
		const purgedUsers = await Character.PurgeTerminated().catch(e => LogSystem.Error('Purge', e));
		await updateLog.edit(updateLog.content + '\nPurged the folowing users:\n' + purgedUsers);

		for (let x = 0; x < 4; x++) {
			const msg = await Character.GetAllCharactersFromForum(x);
			updateLog.edit(updateLog.content + '\n' + msg);
			if (x === 3) {
				message.channel.send('...Done!');
			}
		}

		await Character.SetAllDiscordRoles().then(() => message.channel.send('Set all users\' permissions.'));

		Character.LoadFactionMembers().then(() => message.channel.send('Reloaded all faction members.'));
	}
}
