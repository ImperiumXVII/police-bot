import { Message, MessageActionRow, MessageButton, MessageEmbed, Role, TextChannel } from 'discord.js';
import { getRepository } from 'typeorm';
import { CalloutCollector } from '../callout.collector';
import { BaseCommand } from '../../../core/commands/base.command';
import { Command } from '../../../core/commands/options';
import { Division } from '../../division';
import { DiscordEntity } from '../../../entities/discord_user.entity';
import { CollectorEntity } from '../../../entities/message.entity';
import { PoliceBot } from '../../../core/bot';
import { lspd_logo } from '../../../environment';
import { Character } from '../../character';

type CalloutCommandParams = {
	tags: string;
	incident: string;
};

@Command<CalloutCommandParams>({
	name: ['callout', 'c'],
	channel: ['bot-testing', 'email-inbox'],
	params: {
		tags: {
			validator: 'groups',
			hint: 'division tags',
			mustBe: Division.availableRoles,
		},
		incident: {
			validator: 'no tags',
			hint: 'situation',
		},
	},
})
export class CalloutCommand extends BaseCommand {
	async run(user: DiscordEntity, message: Message, params: CalloutCommandParams): Promise<void> {
		const channel = message.channel;
		const split = params.tags.split(' ');
		const roleArray: string[] = [];
		let tempArray: (Promise<Role | null> | (Role | null))[] = [];
		split.forEach((s) => {
			const id = s.replace(/@/g, '').replace(/</g, '').replace(/>/g, '').replace(/&/g, '');
			// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
			tempArray.push(PoliceBot.Guild!.roles.fetch(id));
		});
		tempArray = await Promise.all(tempArray);
		tempArray.forEach((r) => {
			if (r !== null) {
				roleArray.push((r as Role).name);
			}
		});
		await message.delete();
		const retrievedDivisions = await Division.GetDivisionsFromRoles(roleArray);
		const divisionArray: string[] = [],
			groupArray: string[] = [],
			bureauArray: string[] = [];
		retrievedDivisions.forEach((d) => {
			divisionArray.push(d.division_name);
			groupArray.push(d.group_name);
			bureauArray.push(d.bureau_name);
		});
		if (divisionArray.includes('D Platoon') && !divisionArray.includes('Tactical Emergency Medical Support')) {
			divisionArray.push('Tactical Emergency Medical Support');
			groupArray.push('Metropolitan Division');
			bureauArray.push('Counter Terrorism and Special Operations Bureau');
			params.tags = params.tags + ' <@&803015690150871050>';
		}
		const filteredDivisionArray = [...new Set(divisionArray)];
		const filteredGroupArray = [...new Set(groupArray)];
		const filteredBureauArray = [...new Set(bureauArray)];
		let formattedDivisions!: string, fixedLogo!: string;
		if (filteredBureauArray.length > 1) {
			formattedDivisions = 'Multiple Bureaus';
			fixedLogo = lspd_logo;
		} else if (filteredGroupArray.length > 1) {
			formattedDivisions = retrievedDivisions[0].bureau_name;
			fixedLogo = retrievedDivisions[0].bureau_logo;
		} else if (filteredDivisionArray.length > 1) {
			formattedDivisions = retrievedDivisions[0].group_name;
			fixedLogo = retrievedDivisions[0].group_logo;
		} else {
			formattedDivisions = retrievedDivisions[0].division_name;
			fixedLogo = retrievedDivisions[0].division_logo;
		}
		const calloutEmbed = new MessageEmbed()
			.setColor('#00FF00')
			.setTitle(`${formattedDivisions.toUpperCase()}`)
			.addFields([
				{ name: Character.GetRankShortName(user.rank).toUpperCase(), value: user.character, inline: true },
				{ name: 'REQUESTING', value: divisionArray.join(', '), inline: true },
				{ name: '\u200B', value: '\u200B', inline: false },
				{ name: 'SITUATION', value: params.incident, inline: true },
				{ name: 'STATUS', value: 'ONGOING', inline: true },
				{ name: '\u200B', value: '\u200B', inline: false },
				{ name: 'RESPONDING', value: '\u200B', inline: true },
			])
			.setThumbnail(fixedLogo)
			.setTimestamp();
		const calloutTags = `${params.tags} - ${params.incident}`;
		channel.send(calloutTags).then((msg) => msg.delete());
		const calloutButtons = new MessageActionRow().addComponents([
			new MessageButton({
				label: 'Respond',
				style: 'SUCCESS',
				type: 'BUTTON',
				customId: 'respond',
			}),
			new MessageButton({
				label: 'Conclude',
				style: 'DANGER',
				type: 'BUTTON',
				customId: 'conclude',
			}),
			new MessageButton({
				label: 'Request SWAT',
				style: 'PRIMARY',
				type: 'BUTTON',
				customId: 'request swat',
				disabled: divisionArray.includes('D Platoon'),
			}),
		]);
		const embed = (await channel.send({ embeds: [calloutEmbed], components: [calloutButtons] })) as Message;

		const messageRepository = getRepository(CollectorEntity);
		const messageEntity: CollectorEntity = {
			message_id: embed.id,
			active: true,
			status: 'ONGOING',
			name: params.incident,
			type: 'Callout',
			channel: embed.channel.id,
		};
		if ((message.channel as TextChannel).name === 'email-inbox') {
			if (groupArray.includes('Metropolitan Division')) {
				const metroChannel = PoliceBot.Guild?.channels.cache.find((c) => {
					return c.name === 'metro-callouts';
				}) as TextChannel;
				if (metroChannel !== undefined) {
					metroChannel.send(calloutTags).then((msg) => msg.delete());
					const metroEmbed = await metroChannel.send({ embeds: [calloutEmbed], components: [calloutButtons] });
					messageEntity.twin = metroEmbed.id;
					messageEntity.twin_channel = metroChannel.id;
					const twinEntity: CollectorEntity = {
						message_id: metroEmbed.id,
						active: true,
						status: 'ONGOING',
						name: params.incident,
						type: 'Callout',
						channel: metroEmbed.channel.id,
						twin: embed.id,
						twin_channel: embed.channel.id,
					};
					await messageRepository.save(twinEntity);
				}
			}
		} else if ((message.channel as TextChannel).name === 'bot-testing') {
			if (groupArray.includes('Metropolitan Division')) {
				const metroChannel = PoliceBot.Guild?.channels.cache.find((c) => {
					return c.name === 'bot-testing';
				});
				if (metroChannel !== undefined) {
					channel.send(calloutTags).then((msg) => msg.delete());
					const metroEmbed = await (metroChannel as TextChannel).send({ embeds: [calloutEmbed], components: [calloutButtons] });
					messageEntity.twin = metroEmbed.id;
					messageEntity.twin_channel = metroChannel.id;
					const twinEntity: CollectorEntity = {
						message_id: metroEmbed.id,
						active: true,
						status: 'ONGOING',
						name: params.incident,
						type: 'Callout',
						channel: metroEmbed.channel.id,
						twin: embed.id,
						twin_channel: embed.channel.id,
					};
					await messageRepository.save(twinEntity);
				}
			}
		}
		await messageRepository.save(messageEntity);
		let twinChannel: TextChannel | null = null;
		let twin: Message | null = null;
		if (messageEntity.twin_channel && messageEntity.twin) {
			twinChannel = (await PoliceBot.Client.channels.fetch(messageEntity.twin_channel)) as TextChannel;
			twin = await twinChannel.messages.fetch(messageEntity.twin);
		}
		new CalloutCollector(PoliceBot.Client, embed, twin || null, twinChannel || null);
	}
}
