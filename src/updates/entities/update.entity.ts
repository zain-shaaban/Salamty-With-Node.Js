import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('salamty_updates')
export class Update {
  @PrimaryGeneratedColumn()
  updateID: number;

  @Column('text', { nullable: false, default: "1.0.0" })
  appVersion: string;

  @Column('text', { nullable: false, default: "1.0.0" })
  infoVersion: string;

  @Column('text', { nullable: false, default: "" })
  infoContent: string;
}