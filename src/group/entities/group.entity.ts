import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('salamty_groups')
export class Group {
  @PrimaryGeneratedColumn('uuid')
  groupID: string;

  @Column()
  groupName: string;

  @Column('text', { array: true })
  members: string[];
}
