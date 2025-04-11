import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

interface Coords {
  lat: number;
  lng: number;
}

interface Location {
  time: number;
  coords: Coords;
}

interface LastLocation {
  groupID: string;
  location: Location;
}

interface Path {
  groupID: string;
  path: Location[];
}

interface Destination {
  groupID: string;
  destination: {
    coords: Coords;
    estimatedTime: number;
  };
}
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
  secretKey: string | null;

  @Column({ type: 'boolean', default: false })
  confirmed: boolean;

  @Column({
    type: 'jsonb',
    default: [],
  })
  lastLocation: LastLocation[];

  @Column({ type: 'varchar', nullable: true })
  notificationToken: string | null;

  @Column({ type: 'varchar', nullable: true })
  otp: string | null;

  @Column({ type: 'bigint', nullable: true })
  otpExpiry: number | null;

  @Column({ type: 'boolean', default: false })
  sos: boolean;

  @Column({
    type: 'jsonb',
    default: {},
  })
  path: Path;

  @Column({
    type: 'jsonb',
    default: {},
  })
  destination: Destination;
}
