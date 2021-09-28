/* eslint-disable no-mixed-spaces-and-tabs */
import { Message, User } from 'discord.js';
import { ObjectLiteral } from 'typeorm';
import { DiscordEntity } from '../../entities/discord_user.entity';
import { CommandOptions } from './options';

export interface BaseCommand {
	$options: CommandOptions<{
		[key: string]: string;
	}>;
	run(
		user: DiscordEntity,
		message: Message,
		params?:
			| {
					[key: string]: string | number | null | User;
			  }
			| ObjectLiteral,
	): Promise<void>;
}

export class BaseCommand implements BaseCommand {}
