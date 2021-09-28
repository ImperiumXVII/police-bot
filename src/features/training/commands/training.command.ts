import { Message, MessageActionRow, MessageButton, MessageEmbed } from 'discord.js';
import { getRepository } from 'typeorm';
import { TrainingCollector } from '../training.collector';
import { BaseCommand } from '../../../core/commands/base.command';
import { Command } from '../../../core/commands/options';
import { Division } from '../../division';
import { DiscordEntity } from '../../../entities/discord_user.entity';
import { CollectorEntity } from '../../../entities/message.entity';
import { PoliceBot } from '../../../core/bot';

type TrainingCommandParams = {
	date: string;
	time: string;
	who: string;
	url: string;
};

@Command<TrainingCommandParams>({
	name: 'training',
	channel: ['metro-callouts', 'bot-testing'],
	params: {
		date: {
			validator: 'word',
			hint: 'date (YYYY-MM-DD)',
		},
		time: {
			validator: 'word',
			hint: 'time (HH:MM)',
		},
		who: {
			validator: 'word',
			hint: 'division',
			mustBe: ['SWAT', 'METRO'],
		},
		url: {
			validator: 'url',
			hint: 'URL',
			default: null,
		},
	},
})
export class TrainingCommand extends BaseCommand {
	async run(user: DiscordEntity, message: Message, params: TrainingCommandParams): Promise<void> {
		const channel = message.channel;
		await message.delete();
		const divisionName = params.who === 'SWAT' ? 'D Platoon' : 'A Platoon';
		const trainingEmbed = new MessageEmbed()
			.setColor('#000080')
			.setTitle(`Training Scheduled - ${params.date} at ${params.time}`)
			.setDescription(`A ${divisionName} training has been scheduled. ${params.url === null ? '' : '[Click here](' + params.url + ') for info.'}`)
			.addFields([
				{ name: 'Date', value: params.date, inline: true },
				{ name: 'Time', value: params.time, inline: true },
				{ name: 'Who', value: divisionName, inline: true },
				{ name: '\u200B', value: '\u200B', inline: false },
				{ name: 'Attending', value: '\u200B', inline: false },
				{ name: 'Not Attending', value: '\u200B', inline: false },
			])
			.setThumbnail(await Division.GetLogo(divisionName));
		const role = await Division.GetRole(divisionName);
		channel.send(`TRAINING SCHEDULED <@&${role.id}>`).then((msg) => msg.delete());
		const calloutButtons = new MessageActionRow().addComponents([new MessageButton({ 
			label: 'Attending',
			style: 'PRIMARY',
			type: 'BUTTON',
			customId: 'attending'
		}), new MessageButton({
			label: 'Not Attending',
			style: 'SUCCESS',
			type: 'BUTTON',
			customId: 'not attending'
		})]);
		if(params.url !== null) {
			calloutButtons.addComponents(new MessageButton({
				label: 'Information',
				url: params.url,
				type: 'BUTTON',
				style: 'LINK'
			}));
		}
		const embed = await channel.send({ embeds: [trainingEmbed], components: [calloutButtons] });

		const messageRepository = getRepository(CollectorEntity);
		const messageEntity: CollectorEntity = {
			message_id: embed.id,
			active: true,
			name: `${params.date}T${params.time}`,
			type: 'Training',
			channel: embed.channel.id,
		};
		await messageRepository.save(messageEntity);

		new TrainingCollector(PoliceBot.Client, embed);
	}
}
