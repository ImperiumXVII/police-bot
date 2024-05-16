import { EmbedField, MessageEmbed, Role, TextChannel } from 'discord.js';
import { getRepository } from 'typeorm';
import { DivisionsEntity } from '../../entities/divisions.entity';
import { lspd_logo } from '../../environment';
import { PoliceBot } from '../../core/bot';
import { LogSystem } from '../log';

export class Division {
	static readonly Sections: string[] = [];
	static readonly Divisions: string[] = [];
	static readonly Bureaus: string[] = [];
	static readonly availableRoles: string[] = [];

	static async Init(): Promise<void> {
		if (!PoliceBot.Guild) {
			await new Promise<void>((resolve) => {
				setTimeout(() => {
					resolve();
				}, 2500);
			});
		}
		const divisionRepository = getRepository(DivisionsEntity);
		const divs = await divisionRepository.find();
		divs.forEach((d) => {
			this.Sections.push(d.division_name);
			this.Bureaus.push(d.bureau_name);
			this.Divisions.push(d.group_name);
			this.availableRoles.push(d.role_name);
		});
		const groupString: EmbedField[][] = [[]];
		const divisionEmbeds: MessageEmbed[] = [];
		[...new Set(this.Bureaus)].forEach((b, idx) => {
			const groups = [...new Set(divs.filter((g) => g.bureau_name === b).map((g) => g.group_name))];
			groups.forEach((g) => {
				const divisions = divs
					.filter((d) => d.group_name === g)
					.map((d) => {
						if (d.group_name !== d.division_name) {
							return d.division_name;
						} else {
							return '';
						}
					});
				divisions.forEach((d, idx2) => {
					if (d.length === 0) {
						divisions.splice(idx2, 1);
					}
				});
				if (!groupString[idx]) {
					groupString[idx] = [];
				}
				groupString[idx].push({ name: g, value: `${divisions.length !== 0 ? '\n' + divisions.join('\n') : '\u200B'}`, inline: false });
			});
			divisionEmbeds.push(
				new MessageEmbed()
					.setTitle(b)
					.setTimestamp()
					.setThumbnail(divs.find((bureau) => bureau.bureau_name === b)?.bureau_logo || lspd_logo)
					.setFooter('Los Santos Police Department')
					.setColor('#8D8dFF')
					.addFields(groupString[idx]),
			);
		});
		LogSystem.DiscordLog(
			'Division',
			`Loaded ${[...new Set(this.Sections)].length} sections in ${[...new Set(this.Divisions)].length} divisions across ${
				[...new Set(this.Bureaus)].length
			} bureaus.`,
		);
		const channel = PoliceBot.Guild?.channels.cache.find((c) => c.name === 'bot-testing');
		if (!channel) return;
		(channel as TextChannel).send({ embeds: [...divisionEmbeds] });
	}

	static async GetDivisionsFromRoles(shortNameArray: string[]): Promise<DivisionsEntity[]> {
		const divisionRepository = getRepository(DivisionsEntity);
		const longNameArray: DivisionsEntity[] = [];
		const longNamePromiseArray: Promise<DivisionsEntity | undefined>[] = [];
		shortNameArray.forEach((x) => {
			longNamePromiseArray.push(divisionRepository.findOne({ role_name: x }));
		});
		const resolvedArray = await Promise.all(longNamePromiseArray);
		resolvedArray.forEach((a) => {
			if (a) {
				longNameArray.push(a);
			}
		});
		return longNameArray;
	}

	static async GetLogo(divisionName: string, type = 'division'): Promise<string> {
		const divisionRepository = getRepository(DivisionsEntity);
		const typeName = type + '_name',
			typeUrl = type + '_logo';
		const result = await divisionRepository.findOne({
			[typeName]: divisionName,
		});
		if (result) {
			return result[typeUrl];
		} else {
			return lspd_logo;
		}
	}
	static async GetRole(divisionName: string): Promise<Role> {
		const divisionRepository = getRepository(DivisionsEntity);
		const result = await divisionRepository.findOne({
			division_name: divisionName,
		});
		if (result) {
			const role = PoliceBot.Guild?.roles.cache.find((r) => r.name === result.role_name);
			if (role) {
				return role;
			} else return null as unknown as Role;
		} else {
			return null as unknown as Role;
		}
	}
}
