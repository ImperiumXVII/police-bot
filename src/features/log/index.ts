import { TextChannel } from 'discord.js';
import { PoliceBot } from '../../core/bot';

/* eslint-disable @typescript-eslint/no-explicit-any */
export class LogSystem {
    static Log(feature: string, ...args: any[]): void {
        console.log(`[${feature}] ${args}`);
    }

    static DiscordLog(feature: string, ...args: any[]): void {
        this.Log(feature, ...args);
        if (PoliceBot.Guild) {
            const channel = PoliceBot.Guild?.channels.cache.find((c) => c.name === 'logs-dev');
            if (!channel) return;
            (channel as TextChannel).send(`**[${feature}]** ${args.join('\n')}`);
        }
    }

    static Error(feature: string, ...args: any[]): void {
        console.log(`[Error: ${feature}] ${args}`);
        if (PoliceBot.Guild) {
            const channel = PoliceBot.Guild?.channels.cache.find((c) => c.name === 'logs-dev');
            if (!channel) return;
            (channel as TextChannel).send(`**[Error: ${feature}]** ${args.join('\n')}`);
        }
    }
}
