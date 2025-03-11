import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Group } from './entities/group.entity';
import { CreateGroupDto } from './dto/create-group.dto';
import { AddUserToGroupDto } from './dto/add-user-to-group.dto';
import { Account } from 'src/account/entities/account.entity';
import { LeaveGroupDto } from './dto/leave-group.dto';
import { Op, Sequelize } from 'sequelize';

@Injectable()
export class GroupService {
  constructor(
    @InjectModel(Group) private readonly groupModel: typeof Group,
    @InjectModel(Account) private readonly accountModel: typeof Account,
  ) {}

  async createNewGroup(createGroupDto: CreateGroupDto, userID: number) {
    const { groupName } = createGroupDto;
    const { groupID } = await this.groupModel.create({
      groupName,
      members: JSON.stringify([userID]),
    });
    return { groupID };
  }

  async addUserToGroup(addUserToGroupDto: AddUserToGroupDto, userID: number) {
    const { groupID, secretKey } = addUserToGroupDto;
    const group = await this.groupModel.findByPk(groupID);
    if (!group || !group.members.find((id) => id == userID))
      throw new NotFoundException('The group does not exist');
    const user = await this.accountModel.findOne({ where: { secretKey } });
    if (!user) throw new NotFoundException('user not found');
    if (!group.members.find((id) => id == user.userID)) {
      let users = group.members;
      users.push(user.userID);
      group.members = JSON.stringify(users);
      await group.save();
    }
    return { username: user.username };
  }

  async leaveGroup(leaveGroupDto: LeaveGroupDto, userID: number) {
    const { groupID } = leaveGroupDto;
    const group = await this.groupModel.findByPk(groupID);
    if (!group) throw new NotFoundException('the group does not exist');
    let users = group.members;
    users = users.filter((id) => id != userID);
    if (users.length == 0) await group.destroy();
    else {
      group.members = JSON.stringify(users);
      await group.save();
    }
    return null;
  }

  async getGroups(userID: number) {
    let groups: any = await this.groupModel.findAll({
      where: Sequelize.literal(`JSON_CONTAINS(members, '[${userID}]')`),
    });
    return Promise.all(
      groups.map(async (group) => {
        return await this.accountModel
          .findAll({
            where: { userID: { [Op.in]: group.members } },
            attributes: ['username'],
          })
          .then((accounts) => {
            group.members = JSON.stringify(
              accounts.map((account) => account.username),
            );
            return group;
          });
      }),
    );
  }
}
