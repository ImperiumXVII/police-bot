import { PoliceBot } from '../../core/bot';
import cheerio from 'cheerio';
import { GuildMember, Role, User } from 'discord.js';
import { getRepository } from 'typeorm';
import { DiscordEntity } from '../../entities/discord_user.entity';
import { rankNames } from '../../environment';
import { RankCommand } from './commands/rank.command';
import { NicknameCommand } from './commands/nickname.command';
import { LogSystem } from '../log';
import { UpdateUsersCommand } from './commands/updateusers.command';
import { AddAltCommand } from './commands/addalt.command';
import { DelAltCommand } from './commands/delalt.command';
import { GetPermsCommand } from './commands/getperms.command';
import { RolesCommand } from './commands/roles.command';
import { ForumGroupEntity } from '../../entities/forum-group.entity';
import { utils } from '../..';

export type AlternateCharacter = {
	name: string;
	rank: string;
	serial: number | null;
};
export class Character {
	static FactionMembersLoaded: boolean;

	static async Init(): Promise<void> {
		if(!PoliceBot.Guild) {
			utils.waitUntil(PoliceBot.Guild !== undefined);
		}
		LogSystem.DiscordLog('Character', 'Loading faction members');
		this.LoadFactionMembers().then(() => {
			LogSystem.DiscordLog('Character', 'Faction members loaded.');
			LogSystem.DiscordLog('Character', this.FactionMembers.map(m => m.character).join('\n'));
		});
		//await this.GetUserRequiredRoles(58561);
	}

	static commands = [RankCommand, NicknameCommand, UpdateUsersCommand, AddAltCommand, DelAltCommand, GetPermsCommand, RolesCommand];
	static readonly FactionMembers: DiscordEntity[] = [];

	static async GetGroupsForRole(role: string): Promise<string[]> {
		const roleRepository = getRepository(ForumGroupEntity);
		const roleFound = await roleRepository.findOne({ role_name: role });
		if(!roleFound) {
			const roleToAdd: ForumGroupEntity = {
				role_name: role,
				forum_groups: []
			};
			roleRepository.insert(roleToAdd);
			return [];
		}
		return roleFound.forum_groups;
	}

	static async GetUserRequiredRoles(user: DiscordEntity | number): Promise<void> {
		let forumGroups!: string;
		if(typeof user === 'number') {
			forumGroups = await this.GetForumGroups(user);
		} else {
			forumGroups = await this.GetForumGroups(user.serial);
		}
		LogSystem.DiscordLog('Roles', forumGroups);
	}

	static async AddGroupToRole(role: string, groups: string[]): Promise<void> {
		const roleRepository = getRepository(ForumGroupEntity);
		const roleFound = await roleRepository.findOne({ role_name: role });
		if(!roleFound) {
			const roleToAdd: ForumGroupEntity = {
				role_name: role,
				forum_groups: groups
			};
			await roleRepository.insert(roleToAdd);
			return;
		}
		roleFound.forum_groups.push(...groups);
		roleFound.forum_groups = [...new Set(roleFound.forum_groups)];
		await roleRepository.update({ role_name: role }, roleFound);
		return;
	}

	static async GetForumGroups(serial: number): Promise<string> {
		const groups = await new Promise<string>((resolve) => {
			(async () => {
				const userGroups = await PoliceBot.Browser.newPage();
				userGroups
					.goto('https://pd.lsgov.us/forum/memberlist.php?mode=viewprofile&u=' + serial)
					.then(() => {
						return userGroups.content();
					})
					.then(async (html: string) => {
						const $ = cheerio.load(html);
						$('select').each((idx, el) => {
							resolve($(el).text());
						});
						await userGroups.close();
					})
					.catch((e) => LogSystem.Error('Character', e.message));
			})();
		});
		console.log(groups);
		return groups;
	}

	static async GetAllCharactersFromForum(page = 0): Promise<string> {
		const charactersPromise = new Promise<string[]>((resolve) => {
			(async () => {
				if (!PoliceBot.Browser) {
					await new Promise<void>((resolve) => {
						setTimeout(() => {
							resolve();
						}, 2000);
					});
				}
				const userProfiles = await PoliceBot.Browser.newPage();
				const characterNames: string[] = [];
				await userProfiles
					.goto('https://pd.lsgov.us/forum/memberlist.php?mode=group&g=7&start=' + 25 * page)
					.then(() => {
						return userProfiles.content();
					})
					.then(async (html) => {
						const $ = cheerio.load(html);
						$('.username-coloured').each((idx, el) => {
							characterNames.push($(el).text());
						});
					});
				await userProfiles.close();
				resolve(characterNames);
			})();
		});

		const resolveArray: Promise<Array<DiscordEntity | boolean>>[] = [];
		const resolvedCharacterNames = await charactersPromise;
		const GuildMembers: Promise<GuildMember>[] = [];
		resolvedCharacterNames.forEach((n) => {
			GuildMembers.push(this.GetDiscordName(n) as Promise<GuildMember>);
		});
		const resolvedGuildMembers = await Promise.all(GuildMembers);
		resolvedGuildMembers.forEach((m) => {
			if (m !== undefined) {
				resolveArray.push(this.Load(m.user));
			}
		});
		const finalRes = await Promise.all(resolveArray);
		let retStr = '';
		finalRes.forEach((p) => {
			if ((p[1] as boolean) === true) {
				retStr += `\`${(p[0] as DiscordEntity).character}\`\n`;
			}
		});
		return retStr;
	}

	static GetCharacterName(user?: DiscordEntity): string | undefined {
		if(!user) return undefined;
		const character = PoliceBot.Guild?.members.cache.get(user.id);
		return user.character ? user.character : character?.displayName.split('(')[0].trim().replace(' ', '_').split(' ')[0].replace('_', ' ');
	}

	static GetCharacterNameFromNickname(client: User): string | undefined {
		const character = PoliceBot.Guild?.members.cache.get(client.id);
		return character?.displayName.split('(')[0].trim().replace(' ', '_').split(' ')[0].replace('_', ' ');
	}

	static GetCharacterFromNickname(user: User): DiscordEntity | undefined {
		const characterName = this.GetCharacterNameFromNickname(user);
		return this.FactionMembers.find(fm => fm.character === characterName || fm.alternates.some(a => a.name === characterName));
	}

	static async PurgeTerminated(): Promise<string> {
		const discordRepository = getRepository(DiscordEntity);
		const allUsers = await discordRepository.find();
		const purgeList: string[] = [];
		allUsers.forEach(u => {
			if(u.roles.length === 0) {
				purgeList.push(u.character + ' (no groups)');
				u.roles = [];
				discordRepository.delete(u).catch(e => LogSystem.Error('Purge', e));
			} else if(JSON.stringify(u.roles).includes('guild')) {
				purgeList.push(u.character + ' (not in Discord)');
				discordRepository.delete(u);
			}
		});
		return purgeList.join('\n');
	}

	static async GetDiscordName(characterName: string): Promise<GuildMember | undefined> {
		let user = await PoliceBot.Guild?.members.fetch({ query: characterName });
		if (user && user.size === 0) {
			user = await PoliceBot.Guild?.members.fetch({ query: characterName.replace('_', ' ') });
		}
		return user?.first();
	}

	static async SetAllDiscordRoles(): Promise<void> {
		const userRepository = getRepository(DiscordEntity);
		const users = await userRepository.find();
		for (const client of users) {
			const user = await PoliceBot.Client.users.fetch(client.id);
			if (user === undefined) return;
			const member = await PoliceBot.Guild?.members.fetch(user).catch(async (e) => {
				if (e === 'DiscordAPIError: Unknown Member') {
					await userRepository.delete(client);
					LogSystem.Error('Character', `${client.character} is no longer a member of the Discord server.`);
				}
				return null;
			});
			if (member === null) continue;
			// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
			const roles = member!.roles.cache
				.filter((r: Role) => {
					return r.name !== '@everyone';
				})
				.map((r: Role) => {
					return r.name;
				});
			client.roles = roles;
			await userRepository.save(client);
		}
		LogSystem.Log('Character', 'Roles updated');
	}

	static async LoadFactionMembers(): Promise<void> {
		const userRepository = getRepository(DiscordEntity);
		const users = await userRepository.find();
		users.forEach(u => {
			this.FactionMembers.push(u);
		});
		this.FactionMembersLoaded = true;
	}

	static async Load(client: User): Promise<Array<DiscordEntity | boolean>> {
		const userRepository = getRepository(DiscordEntity);
		const user = await userRepository.findOne({ id: client.id });
		if (!user) {
			const officer = await Character.Save(client);
			if (officer) {
				LogSystem.DiscordLog('Character', `Added ${officer.character} (${officer.username}) to the database`);
				return [officer, true];
			}
		}
		if (user) return [user, false];
		return [
			{
				serial: -1,
				character: 'Unknown',
				username: 'Unknown',
				id: '-1',
				rank: 'Unknown',
				roles: [],
				alternates: []
			},
			false,
		];
	}

	static async GetCharacterSerial(username: string, page = 0): Promise<number> {
		const arr = await new Promise<Record<string, number>>((resolve) => {
			(async () => {
				const userProfiles = await PoliceBot.Browser.newPage();
				userProfiles
					.goto('https://pd.lsgov.us/forum/memberlist.php?mode=group&g=7&start=' + 25 * page)
					.then(() => {
						return userProfiles.content();
					})
					.then(async (html) => {
						const $ = cheerio.load(html);
						const users = Number($('.pagination').text().split('users')[0].trim());
						const element = $('.username-coloured').filter((idx, element) => {
							return $(element).text() === username.replace(' ', '_');
						});
						const href = element.attr('href');
						const serial = Number(new URLSearchParams(href).get('u'));
						await userProfiles.close();
						resolve({ serial: serial, users: users });
					});
			})();
		});
		if (arr.serial === 0) {
			if (page !== Math.ceil(arr.users / 25)) {
				return this.GetCharacterSerial(username, page + 1);
			} else {
				return -1;
			}
		}
		return arr.serial;
	}

	static async Save(client: User): Promise<void | DiscordEntity> {
		const userRepository = getRepository(DiscordEntity);
		const user = await userRepository.findOne({ id: client.id });
		if (!user) {
			const character = await this.GetCharacterNameFromNickname(client);
			if (character === undefined) {
				return LogSystem.Error('Character', 'Character undefined from ' + client.username);
			}
			const serial: number | undefined = await this.GetCharacterSerial(await character);
			if (serial === -1) {
				return LogSystem.Error('Character', `${character} has a serial number of -1. Skipping.`);
			}
			const rank = await this.GetCharacterRank(serial);
			const roles = PoliceBot.Guild?.members.cache.get(client.id)?.roles.cache
				.filter((r: Role) => {
					return r.name !== '@everyone';
				})
				.map((r: Role) => {
					return r.name;
				});
			const entry: DiscordEntity = {
				id: client.id,
				username: client.username,
				serial: serial,
				character: character,
				roles: roles || [],
				rank: rank,
				alternates: [],
			};
			const result = await userRepository.save(entry).catch(async (e) => {
				LogSystem.Error('Character', e.message, entry.username, entry.character, entry.rank);
				if (e.message.includes('username')) {
					return await userRepository.save({
						id: client.id,
						username: 'Unknown',
						serial: serial,
						character: character,
						rank: rank,
					});
				} else {
					return await userRepository.save({
						id: client.id,
						username: client.username,
						serial: serial,
						character: 'Unknown',
						rank: rank,
					});
				}
			});
			return result;
		}
		return user;
	}

	static GetRankShortName(rank: string): string {
		const shortNames: string[] = [
			'Reserve Officer',
			'Reserve Officer',
			'Police Officer',
			'Police Officer',
			'Police Officer',
			'Police Officer',
			'Senior Lead Officer',
			'Detective',
			'Detective',
			'Detective',
			'Sergeant',
			'Sergeant',
			'Lieutenant',
			'Lieutenant',
			'Captain',
			'Captain',
			'Captain',
			'Commander',
			'Deputy Chief',
			'Assistant Chief',
			'Chief of Police',
		];
		return shortNames[rankNames.findIndex((r) => r === rank)];
	}

	static async GetCharacterRank(serial: number): Promise<string> {
		const rank = await new Promise<string>((resolve, reject) => {
			(async () => {
				const userRank = await PoliceBot.Browser.newPage();
				userRank
					.goto('https://pd.lsgov.us/forum/memberlist.php?mode=viewprofile&u=' + serial)
					.then(() => {
						return userRank.content();
					})
					.then(async (html: string) => {
						const $ = cheerio.load(html);
						const children = $('.left-box').children();
						const tags = $(children);
						let rank = '';
						for (let t = 0, len = tags.length; t < len; t++) {
							const tag = tags[t].tagName;
							if (tag === 'dd') {
								if ($(tags[t]).text().includes('LSPD')) {
									continue;
								}
								if (rankNames.includes($(tags[t]).text())) {
									rank = $(tags[t]).text();
								}
							}
						}
						await userRank.close();
						if (rank !== '') {
							resolve(rank);
						} else {
							reject(`Rank name not found for ${serial}.`);
						}
					})
					.catch((e) => LogSystem.Error('Character', e.message));
			})();
		});
		return rank;
	}
}
