import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity('divisions')
export class DivisionsEntity {
	[column: string]: string;
	@PrimaryColumn({ type: 'varchar', length: 64 }) division_name: string;
	@Column({ type: 'varchar', length: 128 }) division_logo: string;
	@Column({ type: 'varchar', length: 64 }) group_name: string;
	@Column({ type: 'varchar', length: 128 }) group_logo: string;
	@Column({ type: 'varchar', length: 64 }) bureau_name: string;
	@Column({ type: 'varchar', length: 128 }) bureau_logo: string;
	@Column({ type: 'varchar', length: 64 }) role_name: string;
}
