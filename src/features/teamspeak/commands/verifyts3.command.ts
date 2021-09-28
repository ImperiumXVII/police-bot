import { Command } from '../../../core/commands/options';
import { BaseCommand } from '../../../core/commands/base.command';
import { DiscordEntity } from '../../../entities/discord_user.entity';
import { Message } from 'discord.js';
import { PoliceBot } from '../../../core/bot';
import { Character } from '../../character';
import { TeamSpeakAPI } from '..';
import { LogSystem } from '../../log';

@Command({
	name: 'verifyts3',
	channel: ['teamspeak-commands', 'bot-testing'],
})
export class VerifyTS3Command extends BaseCommand {
	async run(user: DiscordEntity, message: Message): Promise<void> {
		const clients = await TeamSpeakAPI.ServerQuery.clientList();
		const client = clients.find(async (c) => c.nickname === Character.GetCharacterName(user));
		if (!client) {
			message.channel.send(`Could not find \`${Character.GetCharacterName(user)}\` on the TeamSpeak server. Make sure your names matches this.`);
			return;
		}
		const hasRole = this.getTeamSpeakGroupsFromDiscordRoles(user);
		try {		
			const trues = Object.values(hasRole);
			const groupNames: string[] = [];
			for (const t of trues) {
				if (t) {
					if (client.servergroups.includes(t)) {
						continue;
					}
					const groupName = (await TeamSpeakAPI.ServerQuery.getServerGroupById(t))?.name;
					if (groupName) {
						groupNames.push(groupName);
					}
					client.addGroups(t);
				}
			}
			if (groupNames.length === 0) {
				message.channel.send(`${Character.GetCharacterName(user)} already has all required groups.`);
				return;
			}
			message.channel.send(`**${Character.GetCharacterName(user)}** was assigned to server groups \`${groupNames.join('`, `')}\``);
			TeamSpeakAPI.Log(`**${Character.GetCharacterName(user)}** was assigned to server groups \`${groupNames.join('`, `')}\``);
		} catch(e) {
			LogSystem.Error('TeamSpeak', e);
		}
	}

	getTeamSpeakGroupsFromDiscordRoles(user: DiscordEntity): Record<string, string | undefined> {
		const member = PoliceBot.Guild?.members.cache.find((m) => m.user.username === user.username);
		const hasRole = {
			staff: member?.roles.cache.get('396710223278243860') !== undefined ? '15' : undefined,
			command: member?.roles.cache.get('396710275576889344') !== undefined ? '12' : undefined,
			supervisor: member?.roles.cache.get('396710518125101057') !== undefined ? '14' : undefined,
			detective: member?.roles.cache.get('396710665550692353') !== undefined ? '17' : undefined,
			officer:
				member?.roles.cache.get('396710719095046155') !== undefined ||
				member?.roles.cache.get('669287096585945110') !== undefined ||
				member?.roles.cache.get('396710223278243860') !== undefined ||
				member?.roles.cache.get('396710275576889344') !== undefined ||
				member?.roles.cache.get('396710518125101057') !== undefined ||
				member?.roles.cache.get('396710665550692353') !== undefined
					? '7'
					: undefined,
			swat: member?.roles.cache.get('396717928701100052') !== undefined ? '9' : undefined,
			metro: member?.roles.cache.get('629020273676517386') !== undefined ? '10' : undefined,
		};
		return hasRole;
	}
}
