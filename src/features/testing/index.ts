import { ColorResolvable } from 'discord.js';
import { DiscordEntity } from '../../entities/discord_user.entity';
import { GetMembersCommand } from './getmembers.command';
import { WhoisCommand } from './whois.command';

export class Testing {
	static commands = [WhoisCommand, GetMembersCommand];

	static GetRankColour(char: DiscordEntity): ColorResolvable {
		let color: ColorResolvable = '#FFF';
		if (char.rank.includes('Officer')) {
			color = '#00CCFF';
		} else if (char.rank.includes('Detective')) {
			color = '#BA381C';
		} else if (char.rank.includes('Sergeant') || char.rank.includes('Lieutenant')) {
			color = '#660000';
		} else if (char.rank.includes('Captain') || char.rank.includes('Commander')) {
			color = '#006600';
		} else if (char.rank.includes('Chief')) {
			color = '#0000EE';
		} else if (char.rank.includes('Paramedic')) {
			color = '#AA0000';
		}
		return color;
	}
}
