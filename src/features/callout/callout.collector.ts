/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { ButtonInteraction, Client, Collection, InteractionCollector, Message, MessageActionRow, MessageButton, TextChannel } from 'discord.js';
import { getRepository } from 'typeorm';
import { DiscordEntity } from '../../entities/discord_user.entity';
import { CollectorEntity } from '../../entities/message.entity';
import { Character } from '../character';
import { LogSystem } from '../log';

export class CalloutCollector extends InteractionCollector<ButtonInteraction> {
	private closeTimer: NodeJS.Timeout | null = null;
	twin: Message | null = null;
	twin_channel: TextChannel | null = null;
	twin_collector: CalloutCollector;

	constructor(client: Client, message: Message, twin: Message | null = null, twin_channel: TextChannel | null = null, copyOriginal = false) {
		super(
			client,
			{ time: 3.6e6, dispose: true, message: message },
		);	

		if (twin !== null && twin_channel !== null) {
			this.twin = twin;
			this.twin_channel = twin_channel;

			if (!copyOriginal) {
				this.twin_collector = new CalloutCollector(client, message, this.twin!, message.channel as TextChannel, true);
			}
		}

		this.on('end', async (_collected: Collection<string, ButtonInteraction>, reason: string) => {
			if (copyOriginal) return;
			if (reason === 'time') {
				if (this.twin_collector) {
					this.twin_collector.stop();
				}
			}
			const requesting = message.embeds[0].fields.find((f) => {
				return f.name === 'REQUESTING';
			});
			const status = message.embeds[0].fields.find((f) => {
				return f.name === 'STATUS';
			});
			status!.value = 'CONCLUDED';
			message.embeds[0].setColor('#333333');
			message.embeds[0].setTitle('🔒 ' + message.embeds[0].title);
			const messageRepository = getRepository(CollectorEntity);
			const dbMessage = await messageRepository.findOne({ message_id: message.id });
			dbMessage!.active = false;
			dbMessage!.status = 'CONCLUDED';
			messageRepository.save(dbMessage!);
			const calloutButtons = new MessageActionRow().addComponents([new MessageButton({ 
				label: 'Respond',
				style: 'SUCCESS',
				type: 'BUTTON',
				customId: 'respond',
				disabled: true,
			}), new MessageButton({
				label: 'Restart',
				style: 'SECONDARY',
				type: 'BUTTON',
				customId: 'restart',
				disabled: true
			}), new MessageButton({
				label: 'Request SWAT',
				style: 'PRIMARY',
				type: 'BUTTON',
				customId: 'request swat',
				disabled: true
			})]);
			await message.edit({ embeds: [message.embeds[0]], components: [calloutButtons] });
			if (this.twin && this.twin_channel) {
				await this.twin.edit({ embeds: [message.embeds[0]], components: [calloutButtons] });
				const twinMessage = await messageRepository.findOne({ twin: message.id });
				twinMessage!.active = false;
				twinMessage!.status = 'CONCLUDED';
				messageRepository.save(twinMessage!);
			}
			if (reason !== 'inactive') {
				message.channel.send(
					`\`${requesting!.value}\` situation has been automatically **concluded** at ${new Date().toLocaleString('en-GB', {
						timeZone: 'Europe/Bratislava',
					})}`,
				);
				if (this.twin_channel) {
					this.twin_channel.send(
						`\`${requesting!.value}\` situation has been automatically **concluded** at ${new Date().toLocaleString('en-GB', {
							timeZone: 'Europe/Bratislava',
						})}`,
					);
				}
			} else {
				message.channel.send(
					`\`${requesting!.value}\` situation has been automatically **locked** at ${new Date().toLocaleString('en-GB', {
						timeZone: 'Europe/Bratislava',
					})} due to inactivity for 5 minutes after concluding.`,
				);
				if (this.twin_channel) {
					this.twin_channel.send(
						`\`${requesting!.value}\` situation has been automatically **locked** at ${new Date().toLocaleString('en-GB', {
							timeZone: 'Europe/Bratislava',
						})} due to inactivity for 5 minutes after concluding.`,
					);
				}
			}
		});

		this.on('collect', async (interaction: ButtonInteraction) => {
			const messageRepository = getRepository(CollectorEntity);
			const message = interaction.message as Message;
			const responding = message.embeds[0].fields.find((f) => {
				return f.name === 'RESPONDING';
			});
			const status = message.embeds[0].fields.find((f) => {
				return f.name === 'STATUS';
			});
			if (responding === undefined || status === undefined) return;
			const factionMember = (await Character.Load(interaction.user))[0] as DiscordEntity;
			const character = factionMember.character;
			const rank = factionMember.rank;

			const concludedButtons = new MessageActionRow().addComponents([new MessageButton({ 
				label: 'Respond',
				style: 'SUCCESS',
				type: 'BUTTON',
				customId: 'respond',
				disabled: true
			}), new MessageButton({
				label: 'Restart',
				style: 'SECONDARY',
				type: 'BUTTON',
				customId: 'restart',
			}), new MessageButton({
				label: 'Request SWAT',
				style: 'PRIMARY',
				type: 'BUTTON',
				customId: 'request swat',
				disabled: true
			})]);

			const requestingDivisions = message.embeds[0].fields.find((f) => {
				return f.name === 'REQUESTING';
			});
			
			const calloutButtons = new MessageActionRow().addComponents([new MessageButton({ 
				label: 'Respond',
				style: 'SUCCESS',
				type: 'BUTTON',
				customId: 'respond',
			}), new MessageButton({
				label: 'Conclude',
				style: 'DANGER',
				type: 'BUTTON',
				customId: 'conclude',
			}), new MessageButton({
				label: 'Request SWAT',
				style: 'PRIMARY',
				type: 'BUTTON',
				customId: 'request swat',
				disabled: requestingDivisions?.value.includes('D Platoon')
			})]);

			if (interaction.customId === 'respond') {
				if (responding.value.includes(character)) return;
				if (responding.value.length < 2) {
					responding.value = `${rank} ${character}`;
				} else {
					responding.value += `\n${rank} ${character}`;
				}
			} else if (interaction.customId === 'request swat') {
				const newEmbed = (interaction.message as Message).embeds[0];
				const requesting = message.embeds[0].fields.findIndex((f) => {
					return f.name === 'REQUESTING';
				});
				const situation = message.embeds[0].fields.findIndex((f) => {
					return f.name === 'SITUATION';
				});
				const char = Character.GetCharacterFromNickname(interaction.user);
				newEmbed.fields[requesting].value += ', D Platoon';
				newEmbed.fields[situation].value += `\n\n${new Date().toLocaleTimeString('en-gb', { 
					timeZone: 'Europe/Bratislava', 
					hour12: false
				})}: ${char?.rank} ${char?.character} is requesting SWAT.`;
				(interaction.channel as TextChannel).send(`[${new Date().toLocaleTimeString('en-gb', { 
					timeZone: 'Europe/Bratislava', 
					hour12: false
				})}] ${char?.rank} ${char?.character} is requesting <@&396717928701100052>`);
				const noSWATButtons = new MessageActionRow().addComponents([new MessageButton({ 
					label: 'Respond',
					style: 'SUCCESS',
					type: 'BUTTON',
					customId: 'respond',
				}), new MessageButton({
					label: 'Conclude',
					style: 'DANGER',
					type: 'BUTTON',
					customId: 'conclude',
				}), new MessageButton({
					label: 'Request SWAT',
					style: 'PRIMARY',
					type: 'BUTTON',
					customId: 'request swat',
					disabled: true
				})]);
				interaction.update({ embeds: [newEmbed], components: [noSWATButtons] }).catch(e => { LogSystem.Error('Callout', e); });
			} else if (interaction.customId === 'conclude') {
				if (status.value === 'CONCLUDED') return;
				const requesting = message.embeds[0].fields.find((f) => {
					return f.name === 'REQUESTING';
				});
				await message.channel.send(
					`\`${requesting!.value}\` situation has now been **concluded** by ${factionMember.rank} ${
						factionMember.character
					} at ${new Date().toLocaleString('en-GB', { timeZone: 'Europe/Bratislava' })}`,
				);
				if (this.twin_channel) {
					await this.twin_channel.send(
						`\`${requesting!.value}\` situation has now been **concluded** by ${factionMember.rank} ${
							factionMember.character
						} at ${new Date().toLocaleString('en-GB', { timeZone: 'Europe/Bratislava' })}`,
					);
				}
				status.value = 'CONCLUDED';
				message.embeds[0].color = 0xAA0000;
				this.closeTimer = setTimeout(async () => {
					this.stop('inactive');
					this.closeTimer = null;
				}, 300000);
			} else if (interaction.customId === 'restart') {
				if (status.value !== 'CONCLUDED') return;
				const requesting = message.embeds[0].fields.find((f) => {
					return f.name === 'REQUESTING';
				});
				await message.channel.send(
					`\`${requesting!.value}\` situation has now been **restarted** by ${factionMember.rank} ${
						factionMember.character
					} at ${new Date().toLocaleString('en-GB', { timeZone: 'Europe/Bratislava' })}`,
				);
				if (this.twin_channel) {
					await this.twin_channel.send(
						`\`${requesting!.value}\` situation has now been **restarted** by ${factionMember.rank} ${
							factionMember.character
						} at ${new Date().toLocaleString('en-GB', { timeZone: 'Europe/Bratislava' })}`,
					);
				}
				status.value = 'ONGOING';
				message.embeds[0].color = 0x00FF00;
				clearTimeout(this.closeTimer!);
			}
			if(interaction.customId === 'conclude') {
				await interaction.update({ embeds: [message.embeds[0]], components: [concludedButtons] });
				if (this.twin !== null) {
					await this.twin.edit({ embeds: [message.embeds[0]], components: [concludedButtons] });
				}
			} else if(interaction.customId !== 'request swat') {
				await interaction.update({ embeds: [message.embeds[0]], components: [calloutButtons] });
				if (this.twin !== null) {
					await this.twin.edit({ embeds: [message.embeds[0]], components: [calloutButtons] });
				}
			}
			const entry: CollectorEntity = {
				message_id: message.id,
				active: status.value === 'ONGOING',
				type: 'Callout',
				channel: message.channel.id,
				attending: responding.value.replace(/\n/g, '\\n').replace('\u200B', ''),
				status: status.value,
			};
			messageRepository.save(entry);
		});
	}
}
