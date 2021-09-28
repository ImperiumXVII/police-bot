import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity('discord_collectors')
export class CollectorEntity {
	@PrimaryColumn({ type: 'varchar', length: 128 }) message_id: string;
	@Column({ type: 'bool' }) active: boolean;
	@Column({ type: 'varchar', length: 512 }) name?: string;
	@Column({ type: 'varchar', length: 64 }) type: string;
	@Column({ type: 'varchar', length: 128 }) channel: string;
	@Column({ type: 'varchar', length: 1024 }) attending?: string;
	@Column({ type: 'varchar', length: 1024 }) notattending?: string;
	@Column({ type: 'varchar', length: 64 }) status?: string;
	@Column({ type: 'varchar', length: 128 }) twin?: string;
	@Column({ type: 'varchar', length: 128 }) twin_channel?: string;
}
