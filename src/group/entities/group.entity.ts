import {
  Column,
  DataType,
  Table,
  Model,
  AllowNull,
  PrimaryKey,
  AutoIncrement,
  Unique,
} from 'sequelize-typescript';

@Table({ tableName: 'groups', timestamps: false })
export class Group extends Model {
  @PrimaryKey
  @AutoIncrement
  @Unique
  @Column(DataType.INTEGER)
  groupID: number;

  @AllowNull(false)
  @Column(DataType.STRING)
  groupName: string;

  @Column({
    type: DataType.STRING,
    allowNull: false,
    get() {
      const value = this.getDataValue('members');
      return value ? JSON.parse(value) : {};
    },
  })
  members: any;
}
