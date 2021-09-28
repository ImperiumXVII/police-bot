import { Column, Entity, PrimaryColumn } from 'typeorm';
import { AlternateCharacter } from '../features/character';

@Entity('discord_users')
export class DiscordEntity {
	@PrimaryColumn({ type: 'varchar', length: 128 }) id: string;
	@Column({ type: 'varchar', length: 64 }) username: string;
	@Column({ type: 'int' }) serial: number;
	@Column({ type: 'varchar', length: 32 }) character: string;
	@Column({ type: 'varchar', length: 32 }) rank: string;
	@Column({ type: 'json', default: [] }) roles: string[];
	@Column({ type: 'json', default: [] }) alternates: AlternateCharacter[];
}
