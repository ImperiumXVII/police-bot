import { Command } from '../../../core/commands/options';
import { BaseCommand } from '../../../core/commands/base.command';
import { DiscordEntity } from '../../../entities/discord_user.entity';
import { Message, MessageEmbed } from 'discord.js';
import { TeamSpeakAPI } from '..';

@Command({
	name: 'online',
	channel: ['teamspeak-commands', 'bot-testing'],
})
export class OnlineCommand extends BaseCommand {
	async run(_user: DiscordEntity, message: Message): Promise<void> {
		const clientList = await TeamSpeakAPI.ServerQuery.clientList();
		const members = clientList.map(async (m) => {
			return {
				nickname: m.nickname,
				away: m.away,
				channel: (await TeamSpeakAPI.ServerQuery.getChannelById(m.cid))?.name,
				groups: m.servergroups,
				awayMessage: m.awayMessage,
			};
		});
		const membersDone = await Promise.all(members);
		membersDone.splice(
			membersDone.findIndex((m) => m.nickname === 'Police Administration'),
			1,
		);
		const membersEmbed = new MessageEmbed({
			title: 'TeamSpeak Information',
			description: 'TeamSpeak online users & away status.\n*\\* Italic lines means AFK.*',
			timestamp: new Date().getTime(),
			createdAt: new Date(),
			fields: [
				{
					name: '**Group**',
					value: membersDone
						.map((m) => {
							return m.away ? `_${this.getBestGroup(m.groups)}_` : `${this.getBestGroup(m.groups)}`;
						})
						.join('\n'),
					inline: true,
				},
				{
					name: '**Name**',
					value:
						membersDone
							.map((m) => {
								return m.away ? `_${m.nickname} ${m.awayMessage ? '[' + m.awayMessage + ']' : ''}_` : m.nickname;
							})
							.join('\n') || '\u200B',
					inline: true,
				},
				{
					name: '**Channel**',
					value: membersDone
						.map((m) => {
							return m.away ? `_${m.channel}_` : m.channel;
						})
						.join('\n'),
					inline: true,
				},
			],
		}).setColor('#00CCFF');
		await message.channel.send({ embeds: [membersEmbed] });
	}

	getBestGroup(serverGroups: string[]): string {
		if (serverGroups.includes('15')) return 'Staff Officer';
		if (serverGroups.includes('12')) return 'Command Officer';
		if (serverGroups.includes('14')) return 'Supervisor';
		if (serverGroups.includes('17')) return 'Detective';
		if (serverGroups.includes('7')) return 'LSPD';
		return '\u200B';
	}
}
