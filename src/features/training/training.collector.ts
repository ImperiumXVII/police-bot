import { ButtonInteraction, Client, InteractionCollector, Message } from 'discord.js';
import { getRepository } from 'typeorm';
import { PoliceBot } from '../../core/bot';
import { DiscordEntity } from '../../entities/discord_user.entity';
import { CollectorEntity } from '../../entities/message.entity';
import { Character } from '../character';

export class TrainingCollector extends InteractionCollector<ButtonInteraction> {
	constructor(client: Client, message: Message) {
		super(client, { time: 8.64e7, dispose: true, message: message });

		this.on('collect', async (interaction: ButtonInteraction) => {
			const message = interaction.message as Message;
			const attending = message.embeds[0].fields.find((f) => {
				return f.name === 'Attending';
			});
			const notAttending = message.embeds[0].fields.find((f) => {
				return f.name === 'Not Attending';
			});
			const division = message.embeds[0].fields.find((f) => {
				return f.name === 'Who';
			});
			if (division) {
				if (division.value === 'D Platoon') {
					// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
					const isSWAT = (await PoliceBot.Guild!.members.fetch(interaction.user)).roles.cache.find((r) => {
						return r.name === 'D-PLTN';
					});
					if (!isSWAT) {
						return;
					}
				}
			}
			if (attending === undefined || notAttending === undefined) return;
			if (notAttending.inline) notAttending.inline = false;
			const factionMember = (await Character.Load(interaction.user))[0] as DiscordEntity;
			const character = factionMember.character;
			const rank = factionMember.rank;
			if (interaction.customId === 'attending') {
				if (attending.value.includes(character)) return;
				if (attending.value.length < 2) {
					attending.value = `${rank} ${character}`;
				} else {
					attending.value += `\n${rank} ${character}`;
				}
				if (notAttending.value.includes(character)) {
					let re = new RegExp(`\n${rank} ${character}`, 'g');
					notAttending.value = notAttending.value.replace(re, '');
					re = new RegExp(`${rank} ${character}`, 'g');
					notAttending.value = notAttending.value.replace(re, '');
					if (notAttending.value.length === 0) {
						notAttending.value = '\u200B';
					}
				}
			} else if (interaction.customId === 'not attending') {
				if (notAttending.value.includes(character)) return;
				if (notAttending.value.length < 2) {
					notAttending.value = `${rank} ${character}`;
				} else {
					notAttending.value += `\n${rank} ${character}`;
				}
				if (attending.value.includes(character)) {
					let re = new RegExp(`\n${rank} ${character}`, 'g');
					attending.value = attending.value.replace(re, '');
					re = new RegExp(`${rank} ${character}`, 'g');
					attending.value = attending.value.replace(re, '');
					if (attending.value.length === 0) {
						attending.value = '\u200B';
					}
				}
			}
			await interaction.update({ embeds: [message.embeds[0]] });
			const messageRepository = getRepository(CollectorEntity);
			const entry: CollectorEntity = {
				message_id: message.id,
				active: true,
				name: message.embeds[0].title as string,
				type: 'Training',
				channel: message.channel.id,
				attending: attending.value,
				notattending: notAttending.value,
			};
			messageRepository.save(entry);
		});
	}
}
