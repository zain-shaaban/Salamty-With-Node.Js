import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('salamty_accounts')
export class Account {
  @PrimaryGeneratedColumn('uuid')
  userID: string;

  @Column()
  userName: string;

  @Column({ type: 'varchar', unique: true })
  email: string;

  @Column()
  password: string;

  @Column({ type: 'varchar', nullable: true })
  secretKey: string;

  @Column({ type: 'boolean', default: false })
  confirmed: boolean;

  @Column({
    type: 'jsonb',
    nullable: true,
    default: [],
  })
  lastLocation: any;

  @Column({ type: 'varchar', nullable: true })
  notificationToken: string;

  @Column({ type: 'varchar', nullable: true })
  otp: string;

  @Column({ type: 'bigint', nullable: true })
  otpExpiry: number;

  @Column({ type: 'boolean', default: false })
  sos: boolean;

  @Column({
    type: 'jsonb',
    nullable: true,
    default: {},
  })
  path: any;
}
