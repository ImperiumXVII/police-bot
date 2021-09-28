import { Command } from '../../../core/commands/options';
import { BaseCommand } from '../../../core/commands/base.command';
import { DiscordEntity } from '../../../entities/discord_user.entity';
import { Message, MessageEmbed, TextChannel } from 'discord.js';
import { getRepository } from 'typeorm';
import { ForumGroupEntity } from '../../../entities/forum-group.entity';

@Command({
	name: 'roles2',
	channel: ['group-requests', 'bot-testing']
})
export class RolesCommand extends BaseCommand {
	async run(user: DiscordEntity, message: Message): Promise<void> {
		const list = user.roles;
		const repo = getRepository(ForumGroupEntity);
		const roles: Promise<ForumGroupEntity | undefined>[] = [];
		list.forEach(l => {
			const groups = repo.findOne({ role_name: l });
			roles.push(groups);
		});
		const rolesDone = await Promise.all(roles);
		const embed = new MessageEmbed()
			.setTitle('Forum Groups');
		rolesDone.forEach(rd => {
			if(rd) {
				embed.addField(rd.role_name, rd.forum_groups.join('\n'), false);
			}
		});
		await (message.channel as TextChannel).send({ embeds: [embed] });
	}
}
