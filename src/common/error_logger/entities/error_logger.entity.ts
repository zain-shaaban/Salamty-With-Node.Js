import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('salamty_error_logs')
export class ErrorLogger {
  @PrimaryGeneratedColumn()
  errorID: number;

  @Column({ type: 'varchar' })
  message: string;

  @Column({ type: 'text', nullable: true })
  stack: string;

  @CreateDateColumn()
  timestamp: Date;
}
