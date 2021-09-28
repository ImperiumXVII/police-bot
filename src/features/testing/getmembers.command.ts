import { Message, MessageEmbed } from 'discord.js';
import fs from 'fs';
import { Testing } from '.';
import { PoliceBot } from '../../core/bot';
import { BaseCommand } from '../../core/commands/base.command';
import { Command } from '../../core/commands/options';
import { DiscordEntity } from '../../entities/discord_user.entity';
import { Character } from '../character';
import { LogSystem } from '../log';

export type GetMembersCommandParams = {
	group: string;
	group2?: string;
};

@Command<GetMembersCommandParams>({
	name: 'getmembers',
	channel: ['staff', 'bot-testing', 'training-div-command'],
	params: {
		group: {
			validator: 'word',
			hint: '@group',
		},
		group2: {
			validator: 'word',
			hint: '@group',
			default: null
		},
	},
})
export class GetMembersCommand extends BaseCommand {
	async run(user: DiscordEntity, message: Message): Promise<void> {
		const groupToSearch = message.mentions.roles.first();
		const secondGroup = message.mentions.roles.last();
		if (!groupToSearch || !secondGroup) {
			message.channel.send('Group not found');
			return;
		}
		const members = PoliceBot.Guild?.members.cache;
		if (!members?.size) {
			message.channel.send('Try again later.');
			return;
		}
		const msg = await message.channel.send('Fetching members. First time use may take a while...');
		const timeNow = Date.now();
		await PoliceBot.Guild?.members.fetch({ force: true });
		const mems = groupToSearch.members
			.filter((m) => {
				if(secondGroup === groupToSearch) {
					return m.roles.cache.find((r) => r === groupToSearch) !== undefined;
				} else {
					return m.roles.cache.find((r) => r === groupToSearch) !== undefined && m.roles.cache.find((r) => r === secondGroup) !== undefined;
				}
			})
			.map((m) => {
				return {
					// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
					char: Character.GetCharacterNameFromNickname(m.user)!,
					user: m.user.tag
				};
			});
		const timeTaken = (Date.now() - timeNow) / 1000;
		const fullMembers: string[] = [];
		const tags: string[] = [];
		const characters: string[] = [];
		mems.forEach(m => {
			fullMembers.push(`${m.char} (${m.user})`);
			characters.push(m.char);
			tags.push(m.user);
		});
		if(characters.join('\n').length > 1024 || tags.join('\n').length > 1024) {
			fs.writeFile(`./user-requests/${timeNow}.txt`, fullMembers.join('\n'), () => {
				msg.edit(`Found all users in ${groupToSearch.name}${secondGroup !== groupToSearch ? ' and ' + secondGroup.name : ''} in ${timeTaken} seconds!`).then(async () => {
					try {
						await message.channel.send({ files: [`./user-requests/${timeNow}.txt`] });
					} catch(e) {
						LogSystem.Error('GetMembersCommand', e);
					}
				});
			});
		} else {
			const memberEmbed = new MessageEmbed()
				.setColor(Testing.GetRankColour(user))
				.setFooter(user.character)
				.setTitle(`${groupToSearch.name} ${secondGroup !== groupToSearch ? '& ' + secondGroup.name : ''}`)
				.setTimestamp()
				.addFields({
					name: 'Character', inline: true, value: characters.join('\n') || '\u200B'
				},{
					name: 'Username', inline: true, value: tags.join('\n') || '\u200B'
				})
			;
			await message.channel.send({ embeds: [memberEmbed] });
		}
	}
}
