import {
  Column,
  DataType,
  Table,
  Model,
  AllowNull,
  PrimaryKey,
  AutoIncrement,
  Unique,
  Validate,
} from 'sequelize-typescript';

@Table({ tableName: 'accounts', timestamps: false })
export class Account extends Model {
  @PrimaryKey
  @AutoIncrement
  @Unique
  @Column(DataType.INTEGER)
  userID: number;

  @AllowNull(false)
  @Column(DataType.STRING)
  username: string;

  @Validate({ isEmail: true })
  @Unique
  @AllowNull(false)
  @Column(DataType.STRING)
  email: string;

  @AllowNull(false)
  @Column(DataType.STRING)
  password: string;

  @Column(DataType.STRING)
  secretKey: string;

  @Column({ type: DataType.BOOLEAN, defaultValue: false })
  confirmed: boolean;

  @Column({
    type: DataType.STRING,
    allowNull: true,
    get() {
      const value = this.getDataValue('location');
      return value ? JSON.parse(value) : {};
    },
  })
  location: any;

  @Column(DataType.STRING)
  notificationToken: string;
}
