import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('salamty_updates')
export class Update {
  @PrimaryGeneratedColumn()
  updateID: number;

  @Column('text', { default: '1.0.0' })
  appVersion: string;

  @Column('text', { default: '1.0.0' })
  infoVersion: string;

  @Column('text', { default: '' })
  infoContent: string;
}
