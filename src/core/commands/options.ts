import { User } from 'discord.js';
import { BaseCommand } from './base.command';

type CommandParamValidator = 'user' | 'number' | 'url' | 'string' | 'word' | 'groups' | 'no tags' | readonly unknown[] | unknown[];
type CommandGuardValidator = {
	user?: string | string[];
	permissions?: string | string[];
	groups?: string | string[];
};
interface Command {
	// eslint-disable-next-line @typescript-eslint/ban-types
	fn: Function;
	name: string | string[];
	params?: CommandParamMetaData<User | number | string>;
}

type CommandParamMetaData<T> = {
	[K in keyof T]: {
		hint: string;
		validator: CommandParamValidator;
		default?: User | number | string | null;
		mustBe?: string | string[];
		length?: number;
	};
};

export type CommandOptions<T> = {
	name: string | string[];
	channel: string | string[];
	multiChannel?: boolean;
	roles?: string | string[];
	params?: CommandParamMetaData<T>;
	guard?: CommandGuardValidator;
};

export function Command<T>(options: CommandOptions<T>) {
	return function (constructor: typeof BaseCommand): void {
		constructor.prototype.$options = options;
	};
}
