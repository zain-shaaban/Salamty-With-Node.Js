import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import { GroupService } from './group.service';
import { CreateGroupDto } from './dto/create-group.dto';
import { asyncHandler } from 'src/common/utils/async-handler';
import { AccountAuthGuard } from 'src/common/guards/account.guard';
import { AddUserToGroupDto } from './dto/add-user-to-group.dto';
import { LeaveGroupDto } from './dto/leave-group.dto';

@UseGuards(AccountAuthGuard)
@Controller('group')
export class GroupController {
  constructor(private readonly groupService: GroupService) {}

  @Post('create')
  async createNewGroup(@Body() createGroupDto: CreateGroupDto, @Req() request) {
    return await asyncHandler(
      this.groupService.createNewGroup(createGroupDto, request.user.userID),
    );
  }

  @Post('adduser')
  async addUserToGroup(
    @Body() addUserToGroupDto: AddUserToGroupDto,
    @Req() request,
  ) {
    return await asyncHandler(
      this.groupService.addUserToGroup(addUserToGroupDto, request.user.userID),
    );
  }

  @Post('leave')
  async leaveGroup(@Body() leaveGroupDto: LeaveGroupDto, @Req() request) {
    return await asyncHandler(
      this.groupService.leaveGroup(leaveGroupDto, request.user.userID),
    );
  }
}
