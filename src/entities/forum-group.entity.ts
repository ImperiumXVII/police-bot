import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity('forum_groups')
export class ForumGroupEntity {
	@PrimaryColumn({ type: 'varchar', length: 128, unique: true }) role_name: string;
	@Column({ type: 'json', nullable: true }) forum_groups: string[];
}
