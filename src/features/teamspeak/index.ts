/* eslint-disable indent */
import { Message, TextChannel } from 'discord.js';
import { TeamSpeak, QueryProtocol } from 'ts3-nodejs-library';
import { PoliceBot } from '../../core/bot';
import { LogSystem } from '../log';
import { OnlineCommand } from './commands/online.command';
import { VerifyTS3Command } from './commands/verifyts3.command';

export class TeamSpeakAPI {
	static readonly commands = [VerifyTS3Command, OnlineCommand];
	static ServerQuery: TeamSpeak;
	static MainServer = false;

	static MessageQueue: string[] = [];

	static readonly BackupServerConn = {
		host: 'metro.imperiumxvii.co.uk',
		protocol: QueryProtocol.RAW, //optional
		queryport: 10011, //optional
		serverport: 9987,
		username: 'ImperiumXVII',
		password: '5fuUP51r',
		nickname: 'Police Administration',
	};

	static readonly MainServerConn = {
		host: 'ts.ls-rp,com',
		protocol: QueryProtocol.RAW, //optional
		queryport: 10011, //optional
		serverport: 9988,
		username: 'ImperiumXVII',
		password: '5fuUP51r',
		nickname: 'Police Administration',
	};

	static async Log(message: string): Promise<void> {
		const channel = PoliceBot.Guild?.channels.cache.find((c) => c.name === 'dispatch-logs');
		if (!channel) return;
		(channel as TextChannel).send(`[${new Date().toLocaleTimeString('en-gb', { 
			timeZone: 'Europe/Bratislava', 
			hour12: false
		})}] ${message}`);
	}

	static async ScanMessages(message: Message): Promise<void> {
		if ((message.channel as TextChannel).name === 'teamspeak-commands') {
			if (message.content !== '!online' && message.content !== '!verifyts3') {
				await message.delete();
				return;
			}
		}
	}

	static async Init(): Promise<void> {
		const conn = await TeamSpeak.connect(this.MainServer ? this.MainServerConn : this.BackupServerConn)
			.then(async (teamspeak) => {
				teamspeak.on('close', async () => {
					LogSystem.Error('TeamSpeak', 'unexpectedly disconnected, trying to reconnect...');
					await teamspeak.reconnect(-1, 3000);
					LogSystem.DiscordLog('TeamSpeak', '...reconnected!');
				});

				teamspeak.on('clientconnect', async (e) => {
					const isCivilian = e.client.servergroups.length === 1 && e.client.servergroups[0] === '8';
					if (isCivilian) {
						await new Promise<void>((resolve) => {
							setTimeout(() => {
								resolve();
							}, 500);
						});
						await e.client.message('Welcome. If you\'re in the LSPD, head to #teamspeak-commands on Discord and use !verifyts3');
						await e.client.message('If you\'re in the LSSD, ask a supervisor or above to assign your groups.');
					}
					TeamSpeakAPI.LogQueue(`**${e.client.nickname}** connected.`);
				});

				teamspeak.on('clientdisconnect', async (e) => {
					if (e.client) {
						TeamSpeakAPI.LogQueue(`**${e.client.nickname}** disconnected (${e.event.reasonmsg}).`);
					}
				});

				teamspeak.on('clientmoved', async (e) => {
					const reasons: { [reasonId: string]: string } = {
						'0': 'switched to channel',
						'1': 'was moved to channel',
						'4': 'was kicked to channel',
					};
					TeamSpeakAPI.LogQueue(`**${e.client.nickname}** ${reasons[e.reasonid]} **${e.channel.name}**.`);
				});

				teamspeak.on('textmessage', async (ev) => {
					switch (ev.targetmode) {
						case 1:
							ev.invoker.nickname !== 'Police Administration' ? LogSystem.DiscordLog('TeamSpeak', `**${ev.invoker.nickname}** sent private message: ${ev.msg}`) : void 0;
							break;
						case 2:
							LogSystem.DiscordLog('TeamSpeak', `**${ev.invoker.nickname}** sent message to Lobby channel: ${ev.msg}`);
							break;
						case 3:
							TeamSpeakAPI.Log(`**${ev.invoker.nickname}** sent server message: ${ev.msg}`);
							break;
						}
				});

				LogSystem.DiscordLog('TeamSpeak', 'Connected.');

				setInterval(() => {
					if (this.MessageQueue.length > 0) {
						this.Log(this.MessageQueue.join('\n'));
						this.MessageQueue = [];
					}
				}, 2000);

				return teamspeak;
			})
			.catch((e) => {
				LogSystem.Error('TeamSpeak', e);
			});
		if (conn) {
			this.ServerQuery = conn;
		}
	}

	static LogQueue(message: string): void {
		this.MessageQueue.push(`${message}`);
	}
}
