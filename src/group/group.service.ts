import { Injectable, NotFoundException } from '@nestjs/common';
import { Group } from './entities/group.entity';
import { CreateGroupDto } from './dto/create-group.dto';
import { AddUserToGroupDto } from './dto/add-user-to-group.dto';
import { Account } from 'src/account/entities/account.entity';
import { LeaveGroupDto } from './dto/leave-group.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository, ArrayContains } from 'typeorm';

@Injectable()
export class GroupService {
  constructor(
    @InjectRepository(Group) private groupRepository: Repository<Group>,
    @InjectRepository(Account) private accountRepository: Repository<Account>,
  ) {}

  async createNewGroup(createGroupDto: CreateGroupDto, userID: string) {
    const { groupName } = createGroupDto;
    const { groupID } = await this.groupRepository.save({
      groupName,
      members: [userID],
    });
    return { groupID };
  }

  async addUserToGroup(addUserToGroupDto: AddUserToGroupDto, userID: string) {
    const { groupID, secretKey } = addUserToGroupDto;
    const group = await this.groupRepository.findOneBy({ groupID });
    if (!group || !group.members.find((id) => id == userID))
      throw new NotFoundException('The group does not exist');
    const user = await this.accountRepository.findOneBy({ secretKey });
    if (!user) throw new NotFoundException('user not found');
    if (!group.members.find((id) => id == user.userID)) {
      group.members.push(user.userID);
      await this.groupRepository.save(group);
    }
    return { userName: user.userName, userID: user.userID };
  }

  async leaveGroup(leaveGroupDto: LeaveGroupDto, userID: string) {
    const { groupID } = leaveGroupDto;
    const group = await this.groupRepository.findOneBy({ groupID });
    if (!group) throw new NotFoundException('the group does not exist');
    group.members = group.members.filter((id) => id != userID);
    if (group.members.length == 0) await this.groupRepository.remove(group);
    else {
      await this.groupRepository.save(group);
    }
    const account = await this.accountRepository.findOneBy({ userID });
    account.lastLocation = account.lastLocation.filter(
      (location) => location.groupID != groupID,
    );
    await this.accountRepository.save(account);
    return null;
  }

  async getGroups(userID: string) {
    const groups = await this.groupRepository.find({
      where: {
        members: ArrayContains([userID]),
      },
    });
    return Promise.all(
      groups.map(async (group) => {
        return await this.accountRepository
          .find({
            where: { userID: In(group.members) },
            select: { userName: true, userID: true },
          })
          .then((accounts) => {
            group.members = accounts.map((account) => ({
              userName: account.userName,
              userID: account.userID,
            }));
            return group;
          });
      }),
    );
  }
}
