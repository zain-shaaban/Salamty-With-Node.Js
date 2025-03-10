import {
  Model,
  AutoIncrement,
  Column,
  DataType,
  PrimaryKey,
  Table,
  Unique,
  Sequelize,
} from 'sequelize-typescript';

@Table({ tableName: 'error_logs', timestamps: false })
export class ErrorLogger extends Model {
  @PrimaryKey
  @AutoIncrement
  @Unique
  @Column(DataType.INTEGER)
  errorID: number;

  @Column({ type: DataType.STRING, allowNull: false })
  message: string;

  @Column({ type: DataType.TEXT })
  stack: string;

  @Column({ defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') })
  timestamp: Date;
}
