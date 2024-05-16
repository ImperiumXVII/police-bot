import { ColorResolvable, Message, MessageEmbed } from 'discord.js';
import { getRepository } from 'typeorm';
import { BaseCommand } from '../../core/commands/base.command';
import { Command } from '../../core/commands/options';
import { DiscordEntity } from '../../entities/discord_user.entity';
import { lspd_logo, rankImages, rankNames } from '../../environment';

type WhoisCommandParams = {
	user: string;
};

@Command<WhoisCommandParams>({
	name: 'whois',
	channel: ['bot-testing', 'general-discussion', 'user-changes'],
	params: {
		user: {
			validator: 'user',
			hint: 'character name/serial number/OOC name',
		},
	},
})
export class WhoisCommand extends BaseCommand {
	async run(user: DiscordEntity, message: Message, params: WhoisCommandParams): Promise<void> {
		const userRepository = getRepository(DiscordEntity);
		// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
		const char = (await userRepository.findOne({ character: params.user }))!;
		const rankImage = rankImages[rankNames.indexOf(char.rank)];
		let color!: ColorResolvable;
		if (char.rank.includes('Officer')) {
			color = '#00CCFF';
		} else if (char.rank.includes('Detective')) {
			color = '#BA381C';
		} else if (char.rank.includes('Sergeant') || char.rank.includes('Lieutenant')) {
			color = '#660000';
		} else if (char.rank.includes('Captain') || char.rank.includes('Commander')) {
			color = '#006600';
		} else if (char.rank.includes('Chief')) {
			color = '#0000EE';
		} else if (char.rank.includes('Paramedic')) {
			color = '#AA0000';
		}
		const infoEmbed = new MessageEmbed()
			.setThumbnail(rankImage)
			.setColor(color)
			.setTitle('Member Information')
			.setAuthor('', lspd_logo)
			.setFooter('Los Santos Police Department', lspd_logo)
			.setTimestamp()
			.addFields([
				{ name: 'Character', value: char.character, inline: true },
				{ name: 'Rank', value: char.rank, inline: true },
				{ name: '\u200B', value: '\u200B', inline: true },
				{ name: 'Username', value: char.username, inline: true },
				{ name: 'Serial', value: char.serial.toString(), inline: true },
				{ name: '\u200B', value: '\u200B', inline: true },
				{ name: 'Discord', value: `<@${char.id}>`, inline: true },
				{ name: 'Forum Profile', value: `[Click](https://pd.lsgov.us/forum/memberlist.php?mode=viewprofile&u=${char.serial})`, inline: true },
			]);
		if (char.alternates !== null) {
			const altCharacters = Object.values(char.alternates)
				.map((a) => {
					return `${a.rank} ${a.name} ${a.serial !== null ? '(' + a.serial + ')' : ''}`;
				})
				.join('\n');
			if (altCharacters.length) {
				infoEmbed.addFields({ name: '\u200B', value: '\u200B', inline: true }, { name: 'Alternate Characters', value: altCharacters, inline: true });
			}
		}
		message.channel.send({ embeds: [infoEmbed] });
	}
}
