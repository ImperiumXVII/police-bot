import { Message, TextChannel, User } from 'discord.js';
import { ObjectLiteral } from 'typeorm';
import { DiscordEntity } from '../../entities/discord_user.entity';
import { Character } from '../../features/character';
import { LogSystem } from '../../features/log';
import { PoliceBot } from '../bot';
import { BaseCommand } from './base.command';

export class Command {
	static FirstCharacter = '!';
	static List: BaseCommand[] = [];
	static Commands: string[][] = [];

	static GetCommand(name: string): BaseCommand | undefined {
		return this.List.find((cmd: BaseCommand) => {
			if (Array.isArray(cmd.$options.name)) {
				return cmd.$options.name.indexOf(name.toLowerCase()) !== -1;
			}
			return cmd.$options.name.toLowerCase() === name.toLowerCase();
		});
	}

	static async Init(features: { commands?: typeof BaseCommand[] }[]): Promise<void> {
		features
			.filter((feature) => feature.commands)
			.forEach((feature) => {
				feature.commands?.forEach((FeatureCommand: typeof BaseCommand) => {
					const command = new FeatureCommand();
					if (this.AreCommandParamsValid(command)) {
						this.List.push(command);
						this.Commands.push(Array.isArray(command.$options.name) ? command.$options.name : [command.$options.name]);
					}
				});
			});
		const commandString: string[] = [];
		this.Commands.forEach(c => {
			if(c.length === 1) {
				commandString.push(`\`${c[0]}\``);
			} else {
				commandString.push(`\`${JSON.stringify(c).replace(/"/g, '').replace(/,/g, ', ')}\``);
			}
		});
		LogSystem.DiscordLog('Command', `${this.List.length} commands loaded: \n\t${commandString.join('\n\t')}`);
	}

	static AreCommandParamsValid(command: BaseCommand): boolean {
		if (!command.$options.params) {
			return true;
		}

		const paramKeys = Object.keys(command.$options.params);
		const invalidParams = paramKeys
			.map((pk: string) => command.$options.params?.[pk])
			.find((param, index) => {
				if (param?.validator === 'string' && index !== paramKeys.length - 1) {
					LogSystem.Error(
						'Command',
						`Not including command ${command.$options.name} because it has param ${paramKeys[index]} of type 'String' which isn't at the end of parameter list.`,
					);
					return true;
				}

				if (param?.default !== undefined) {
					if (paramKeys.slice(index).find((pk) => command.$options.params?.[pk].default === undefined)) {
						LogSystem.Error(
							'Command',
							`Not including command ${command.$options.name} because param ${paramKeys[index]} is optional, and param(s) after it are not.`,
						);
						return true;
					}
				}

				return false;
			});
		if (!invalidParams) {
			return true;
		}
		return false;
	}

	static async PerformCommand(user: DiscordEntity, message: Message, command: BaseCommand, uncheckedParams: ObjectLiteral): Promise<boolean> {
		const channel = message.channel as TextChannel;
		let commandAllowed = false;
		if (command.$options.channel.length !== 0) {
			if (!command.$options.channel.includes(channel.name)) {
				channel.send(
					`${user.character}, you may only use this command in #${
						Array.isArray(command.$options.channel) ? command.$options.channel.join(', #') : command.$options.channel
					}`,
				);
				commandAllowed = false;
				return false;
			}
		}

		if (command.$options.guard !== undefined) {
			if (command.$options.guard.user !== undefined) {
				if (command.$options.guard.user.includes(message.author.id) || command.$options.guard.user.includes(message.author.username)) {
					commandAllowed = true;
				} else {
					channel.send(`${user.character}, you do not have permission to use this command.`);
					commandAllowed = false;
				}
			}
			if (command.$options.guard.groups !== undefined && commandAllowed == false) {
				const userGroups = message.guild?.members.cache.get(message.author.id)?.roles.cache.some((r) => {
					return command.$options.guard?.groups?.includes(r.id) || false;
				});
				if (!userGroups) {
					channel.send(`${user.character}, you do not have permission to use this command.`);
					commandAllowed = false;
				} else {
					commandAllowed = true;
				}
			}
			if (command.$options.guard.permissions !== undefined && commandAllowed == false) {
				const userPermissions = message.guild?.members.resolve(message.author)
					?.permissions.toArray()
					.some((p) => {
						return command.$options.guard?.groups?.includes(p) || false;
					});
				if (!userPermissions) {
					channel.send(`${user.character}, you do not have permission to use this command.`);
					commandAllowed = false;
				} else {
					commandAllowed = true;
				}
			}
		} else {
			commandAllowed = true;
		}

		if (commandAllowed === false) {
			return false;
		}

		if (command.$options.roles !== undefined && command.$options.roles !== null) {
			if (Character.FactionMembersLoaded === false) {
				channel.send('You cannot use this command yet. Please wait until all faction members are loaded!');
				return false;
			}
		}

		if (!command.$options.params) {
			await command.run(user, message, uncheckedParams);
			return true;
		}

		const params: {
			[key: string]: string | number | null | User;
		} = {};

		const commandParameterNames = Object.keys(command.$options.params);
		const mandatoryParameters = commandParameterNames.filter((pk) => command.$options.params?.[pk].default === undefined).length;

		if (uncheckedParams.length < mandatoryParameters) {
			const missing = commandParameterNames.slice(uncheckedParams.length).map((param) => {
				return `${command.$options.params?.[param].hint}${
					command.$options.params?.[param].default ? ` (default: ${command.$options.params?.[param].default})` : ''
				}`;
			});
			(channel as TextChannel).send(
				`Missing parameter${missing.length > 1 ? 's' : ''}: !${
					Array.isArray(command.$options.name) ? command.$options.name[0] : command.$options.name
				} [${missing.join('] [')}]`,
			);
			return false;
		}

		const errors: [string, string][] = [];

		commandParameterNames.map((paramName: string, index) => {
			if (!command.$options.params) {
				return false;
			}

			const paramMetaData = command.$options.params[paramName];

			const validator = paramMetaData.validator;
			const mustBe = paramMetaData.mustBe;
			const hint = paramMetaData.hint;
			const value = uncheckedParams[index];

			if (value === undefined && paramMetaData.default !== undefined) {
				params[paramName] = paramMetaData.default;
				return true;
			}

			if (mustBe) {
				if (validator === 'groups') {
					const id = value.replace(/@/g, '').replace(/</g, '').replace(/>/g, '').replace(/&/g, '');
					const role_name = PoliceBot.Guild?.roles.resolve(id)?.name;
					if (Array.isArray(mustBe)) {
						const some = mustBe.some((mb) => {
							return role_name === mb;
						});
						if (some === false) {
							errors.push([hint, `must be one of "${mustBe.join('", "')}"`]);
							return false;
						}
					} else if (mustBe !== role_name) {
						errors.push([hint, `must be "${mustBe}"`]);
						return false;
					}
				} else {
					const val = validator === 'word' ? value : uncheckedParams.slice(index).join(' ');
					if (Array.isArray(mustBe)) {
						const some = mustBe.some((mb) => {
							return val === mb;
						});
						if (some === false) {
							errors.push([hint, `must be one of \`${mustBe.join('`, `')}\``]);
							return false;
						}
					} else if (mustBe !== val) {
						errors.push([hint, `must be "${mustBe}"`]);
						return false;
					}
				}
			}

			if (validator === 'number') {
				if (!/^[+-]?([0-9]*[.])?[0-9]+$/.test(value)) {
					return errors.push([hint, 'has to be a number']);
				}
				params[paramName] = Number(uncheckedParams[index]);
				return true;
			}

			if (validator === 'url') {
				if (!value.includes('http://') && !value.includes('https://')) {
					return errors.push([hint, 'has to be a URL']);
				}
				params[paramName] = value;
				return true;
			}

			if (validator === 'user') {
				if (Character.FactionMembersLoaded === false) {
					return errors.push([hint, 'Faction members not yet loaded!']);
				}
				const firstLast = uncheckedParams.slice(index);
				const character = value.includes('_') ? value.replace('_', ' ') : `${firstLast[0]} ${firstLast[1] !== undefined ? firstLast[1] : ''}`.trim();
				const factionMembers: Record<string, string[]> = {};
				Character.FactionMembers.forEach((m) => {
					factionMembers[m.username] = [m.character, String(m.serial)];
					if (m.alternates) {
						factionMembers[m.username] = [
							m.character,
							String(m.serial),
							...Object.values(m.alternates).map((a) => a.name),
							...Object.values(m.alternates).map((a) => String(a.serial)),
						];
					}
					return factionMembers;
				});
				if (
					Object.values(factionMembers).some((fm) => {
						return fm.includes(character);
					})
				) {
					const name = Object.entries(factionMembers).find((fm) => {
						if (fm[1].includes(character)) {
							return true;
						}
					});
					if (name !== undefined) {
						params[paramName] = name[1][0];
						return true;
					} else {
						return errors.push([hint, 'must be a current faction member']);
					}
				}
				const usernames = Object.keys(factionMembers);
				if (usernames.includes(character)) {
					params[paramName] = factionMembers[character][0];
					return true;
				}
				return errors.push([hint, 'must be a current faction member']);
			}

			if (validator === 'groups') {
				const input = uncheckedParams.slice(index).join(' ');
				const groups = input.slice(0, input.lastIndexOf('>') + 1);
				if (!groups.includes('<@&') || !groups.includes('>')) {
					return errors.push([hint, 'has to be a group mention (@METRO, etc)']);
				}
				params[paramName] = groups;
				return true;
			}

			if (validator === 'no tags') {
				const input = uncheckedParams.slice(index).join(' ');
				const param = input.slice(input.lastIndexOf('>') + 1).trim();
				if (!param.includes('<@') || !param.includes('>')) {
					params[paramName] = param;
					return true;
				}
			}

			if (validator === 'string') {
				const input = uncheckedParams.slice(index).join(' ');
				if (paramMetaData.length && input.length > paramMetaData.length) {
					return errors.push([hint, `longer than ${paramMetaData.length} symbols`]);
				}
				params[paramName] = input;
				return true;
			}

			if (validator === 'word') {
				if (paramMetaData.length && value.length > paramMetaData.length) {
					return errors.push([hint, `longer than ${paramMetaData.length} symbols`]);
				}
				params[paramName] = value;
				return true;
			}

			if (Array.isArray(validator)) {
				if (validator.indexOf(uncheckedParams[index]) === -1) {
					return errors.push([hint, `not one of: ${validator.join(', ')}`]);
				}
				params[paramName] = uncheckedParams[index];
				return true;
			}

			params[paramName] = uncheckedParams[index];
			return true;
		});

		if (errors.length) {
			const message = `Invalid parameter${errors.length > 1 ? 's' : ''}: ${errors.map((e) => `${e[0]} (${e[1]})`).join(', ')}`;
			channel.send(message);
			return false;
		}

		await command.run(user, message, params);
		return true;
	}
}
