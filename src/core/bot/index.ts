import { Message, Client, Guild, TextChannel, Intents } from 'discord.js';
import { environment } from '../../environment';
import puppeteer from 'puppeteer';
import { Command } from '../commands';
import { getRepository } from 'typeorm';
import { CollectorEntity } from '../../entities/message.entity';
import { TrainingCollector } from '../../features/training/training.collector';
import { Character } from '../../features/character';
import { LogSystem } from '../../features/log';
import { CalloutCollector } from '../../features/callout/callout.collector';
import { DiscordEntity } from '../../entities/discord_user.entity';
import { TeamSpeakAPI } from '../../features/teamspeak';

const intents = new Intents([Intents.FLAGS.GUILD_MEMBERS, Intents.FLAGS.GUILD_MESSAGES, Intents.FLAGS.DIRECT_MESSAGES, Intents.FLAGS.GUILDS]);

export class PoliceBot {
    static Client = new Client({ intents: intents });
    static Guild?: Guild;
    static Browser: puppeteer.Browser;

    static async Init(): Promise<void> {
        await this.Client.login(environment.discord_id);
        this.Client.on('ready', async () => {
            await this.Client.guilds.fetch();
            const g = this.Client.guilds.cache.first();
            if (!g) return this.Client.destroy();
            this.Guild = g;
            LogSystem.Log('PoliceBot', `Logged in as ${this.Client.user?.username}!`);
            this.Browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox', '--lang=en-GB'], headless: true });
            this.Client.user?.setActivity('the Los Santos Police Department', { type: 'WATCHING' });
            await this.FetchOldCollectors();
            if (this.Guild) {
                try {
                    LogSystem.DiscordLog('PoliceBot', 'Ready');
                } catch (e) {
                    console.log(e);
                }
            }
        });
        this.Client.on('messageCreate', this.ParseCommand.bind(this));
    }

    static async FetchOldCollectors(): Promise<void> {
        const messageRepository = getRepository(CollectorEntity);
        const collectors = await messageRepository.find();
        collectors.forEach(async (c) => {
            if (c.active) {
                const channel = PoliceBot.Guild?.channels.resolve(c.channel);
                if (channel?.type === 'GUILD_TEXT') {
                    const textChannel = channel as TextChannel;
                    const message = await textChannel.messages.fetch(c.message_id).catch((e) => {
                        if (e.message === 'DiscordAPIError: Unknown Message') {
                            messageRepository.delete(c);
                            return null;
                        }
                    });
                    if (message === null || message === undefined) {
                        return;
                    }
                    if (c.type === 'Training') {
                        new TrainingCollector(PoliceBot.Client, message);
                    } else if (c.type === 'Callout') {
                        let twinChannel: null | TextChannel = null;
                        let twin: null | Message = null;
                        if (c.twin_channel && c.twin) {
                            twinChannel = (await PoliceBot.Client.channels.fetch(c.twin_channel)) as TextChannel;
                            twin = await twinChannel.messages.fetch(c.twin);
                        }
                        new CalloutCollector(PoliceBot.Client, message, twin || null, twinChannel || null);
                    }
                }
            }
        });
    }

    static async ParseCommand(message: Message): Promise<void> {
        if (message.author.bot) {
            return;
        }
        const user = await Character.Load(message.author);
        await TeamSpeakAPI.ScanMessages(message);
        if (message.content[0] === Command.FirstCharacter && message.content !== Command.FirstCharacter) {
            const strtok = message.content.split(' ');
            const cmd = strtok[0].slice(1);
            const params = strtok.slice();
            params.splice(0, 1);
            const command = Command.GetCommand(cmd);
            if (command !== undefined) {
                try {
                    Command.PerformCommand(user[0] as DiscordEntity, message, command, params);
                } catch (e) {
                    LogSystem.Error(command.$options.name[0] || 'Unknown Command', e);
                }
            }
        }
    }
}

export const policeBot = new PoliceBot();
