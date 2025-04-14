import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { Group } from './entities/group.entity';
import { CreateGroupDto } from './dto/create-group.dto';
import { AddUserToGroupDto } from './dto/add-user-to-group.dto';
import { Account } from 'src/account/entities/account.entity';
import { LeaveGroupDto } from './dto/leave-group.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository, ArrayContains } from 'typeorm';
import { UpdateSocketGateway } from 'src/gateway/update-socket/update-socket.gateway';

@Injectable()
export class GroupService {
  constructor(
    @InjectRepository(Group) private groupRepository: Repository<Group>,
    @InjectRepository(Account) private accountRepository: Repository<Account>,
    @Inject() private readonly updateGateway: UpdateSocketGateway,
  ) {}

  async createNewGroup(
    { groupName }: CreateGroupDto,
    userID: string,
  ): Promise<{ groupID: string }> {
    const savedGroup = await this.groupRepository.save({
      groupName,
      members: [userID],
    });
    return { groupID: savedGroup.groupID };
  }

  async addUserToGroup(
    { groupID, secretKey }: AddUserToGroupDto,
    userID: string,
  ): Promise<{ userName: string; userID: string }> {
    const group = await this.groupRepository.findOneBy({ groupID });

    const isUserInGroup = group?.members.includes(userID);

    if (!isUserInGroup)
      throw new NotFoundException(
        'The group does not exist or access is denied',
      );
    const user = await this.accountRepository.findOneBy({ secretKey });
    if (!user) throw new NotFoundException('User not found');

    const isAlreadyMember = group.members.includes(user.userID);

    if (!isAlreadyMember) {
      this.updateGateway.newGroup(user.userID);

      const otherMembers = group.members.filter((user) => user !== userID);
      this.updateGateway.joinedGroup(otherMembers);
      group.members.push(user.userID);
      this.groupRepository.save(group);
    }
    return { userName: user.userName, userID: user.userID };
  }

  async leaveGroup({ groupID }: LeaveGroupDto, userID: string): Promise<null> {
    const group = await this.groupRepository.findOneBy({ groupID });
    if (!group) throw new NotFoundException('Group not found');
    group.members = group.members.filter((id) => id !== userID);

    if (group.members.length == 0) await this.groupRepository.remove(group);
    else await this.groupRepository.save(group);

    const account = await this.accountRepository.findOneBy({ userID });

    if (!account) throw new NotFoundException('Account not found');

    account.lastLocation = account.lastLocation.filter(
      (location) => location.groupID !== groupID,
    );
    this.updateGateway.leftGroup(group.members);
    await this.accountRepository.save(account);
    return null;
  }

  async getGroups(userID: string): Promise<
    {
      groupID: string;
      groupName: string;
      members: { userID: string; userName: string }[];
    }[]
  > {
    const groups = await this.groupRepository.find({
      where: {
        members: ArrayContains([userID]),
      },
    });

    const enrichedGroups = await Promise.all(
      groups.map(async (group) => {
        const memberAccounts = await this.accountRepository.find({
          where: { userID: In(group.members) },
          select: { userID: true, userName: true },
        });
        return { ...group, members: memberAccounts };
      }),
    );
    return enrichedGroups;
  }
}
