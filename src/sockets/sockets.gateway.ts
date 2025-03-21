import { Inject } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/sequelize';
import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Op } from 'sequelize';
import { Server, Socket } from 'socket.io';
import { Account } from 'src/account/entities/account.entity';

import { ErrorLoggerService } from 'src/common/error_logger/error_logger.service';
import { Group } from 'src/group/entities/group.entity';
import { NotificationService } from 'src/notification/notification.service';

export let allGroups: any = [];

function deleteOfflineUsersFromAllGroups() {
  allGroups = allGroups.filter((group) => {
    const allIsOffline = group.members.every((user) => user.offline == true);
    return !allIsOffline;
  });
}

@WebSocketGateway()
export class SocketsGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  io: Server;

  constructor(
    private readonly logger: ErrorLoggerService,
    @InjectModel(Account) private readonly accountModel: typeof Account,
    @InjectModel(Group) private readonly groupModel: typeof Group,
    @Inject() private readonly notificationService: NotificationService,
    private readonly jwtService: JwtService,
  ) {
    setInterval(async () => {
      allGroups = await Promise.all(
        allGroups.map(async (group) => {
          group.members = await Promise.all(
            group.members.map(async (user) => {
              if (
                Date.now() - user.location.time > 1000 * 60 &&
                user.socketID == null &&
                user.offline == false
              ) {
                user.offline = true;
                let account = await this.accountModel.findByPk(user.userID);
                let locationsArray = account.lastLocation.filter(
                  (oneGroup) => oneGroup.groupID != group.groupID,
                );
                locationsArray = [
                  ...locationsArray,
                  { groupID: group.groupID, location: user.location },
                ];
                if (user.sos)
                  await account.update({
                    lastLocation: locationsArray,
                    sos: user.sos,
                    path: { groupID: group.groupID, path: user.path },
                  });
                else {
                  await account.update({
                    lastLocation: locationsArray,
                    sos: user.sos,
                  });
                }
                return user;
              } else if (
                Date.now() - user.location.time > 1000 * 30 &&
                user.socketID == null &&
                user.notificationSent == false
              ) {
                user.notificationSent = true;
                this.notificationService.send({
                  userID: user.userID,
                  groupID: group.groupID,
                  title: 'سلامتي - إشعار تفقد',
                  content: `لم يرسل ${user.userName} موقعه ل ${group.groupName} منذ 30 دقيقة`,
                });
                return user;
              } else {
                return user;
              }
            }),
          );
          return group;
        }),
      );
      deleteOfflineUsersFromAllGroups();
    }, 1000 * 15);
  }

  async handleConnection(client: Socket) {
    try {
      const { userID, socketID, userName, location, groupID } =
        this.getDetails(client);
      const group = await this.groupModel.findByPk(groupID);
      if (!group || !group.members.find((id) => id == userID))
        client.disconnect();
      let myGroup = allGroups.find((group) => group.groupID == groupID);
      if (!myGroup) {
        myGroup = { groupID, groupName: group.groupName, members: [] };
        const members = await this.accountModel.findAll({
          where: { userID: { [Op.in]: group.members } },
          attributes: ['userID', 'userName', 'lastLocation', 'sos', 'path'],
        });
        members.map((user) => {
          if (user.userID != userID) {
            const lastLocation = user.lastLocation.find(
              (lastLocation) => lastLocation.groupID == groupID,
            )?.location;
            if (lastLocation)
              if (user.sos && user.path?.groupID == groupID)
                myGroup.members.push({
                  userID: user.userID,
                  socketID: null,
                  userName: user.userName,
                  location: lastLocation,
                  notificationSent: true,
                  offline: true,
                  sos: user.sos,
                  path: user.path.path,
                });
              else
                myGroup.members.push({
                  userID: user.userID,
                  socketID: null,
                  userName: user.userName,
                  location: lastLocation,
                  notificationSent: true,
                  offline: true,
                  sos: false,
                  path: [],
                });
          } else {
            if (user.sos) {
              user.path.push(location);
              myGroup.members.push({
                userID,
                socketID,
                userName,
                location,
                notificationSent: false,
                offline: false,
                sos: user.sos,
                path: user.path.path,
              });
            } else {
              myGroup.members.push({
                userID,
                socketID,
                userName,
                location,
                notificationSent: false,
                offline: false,
                sos: user.sos,
                path: [],
              });
            }
          }
        });
        allGroups.push(myGroup);
      } else {
        const user = myGroup.members.find((user) => user.userID == userID);
        if (user) {
          if (user.sos) user.path.push(location);
          user.socketID = socketID;
          user.location = location;
          user.notificationSent = false;
          user.offline = false;
        } else {
          myGroup.members.push({
            userID,
            socketID,
            userName,
            location,
            notificationSent: false,
            offline: false,
            sos: false,
            path: [],
          });
        }
      }
      client.join(groupID);
      let allGroupMembers = allGroups.find(
        (group) => group.groupID == groupID,
      )?.members;
      allGroupMembers = allGroupMembers.map((user) => {
        let myUser = {
          userID: user.userID,
          location: user.location,
          sos: user.sos,
          path: user.path,
        };
        return myUser;
      });
      client.emit('onConnection', {
        groupMembers: allGroupMembers.filter((user) => user.userID != userID),
      });
      let user = myGroup.members.find((user) => user.userID == userID);
      this.sendNewLocation(groupID, userID, location, user.sos);
      return { status: true };
    } catch (error) {
      this.logger.error(error.message, error.stack);
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    try {
      const { groupID, userID } = this.getDetails(client);
      allGroups = allGroups.map((group) => {
        if (group.groupID == groupID) {
          group.members = group.members.map((user) => {
            if (user.userID == userID) user.socketID = null;
            return user;
          });
        }
        return group;
      });
      return {
        status: true,
      };
    } catch (error) {
      this.logger.error(error.message, error.stack);
      return {
        status: false,
        message: error.message,
      };
    }
  }

  @SubscribeMessage('sos')
  async sosMode(@ConnectedSocket() client: Socket) {
    const { userID, userName, groupID } = this.getDetails(client);
    this.notificationService.send({
      userID,
      groupID,
      title: 'سلامتي - إشعار خطر',
      content: `${userName} في وضع الخطر`,
    });
    let myGroup = allGroups.find((group) => group.groupID == groupID);
    let myUser = myGroup.members.find((user) => user.userID == userID);
    myUser.sos = true;
  }

  @SubscribeMessage('endsos')
  async endsosMode(@ConnectedSocket() client: Socket) {
    const { userID, userName, groupID } = this.getDetails(client);
    this.notificationService.send({
      userID,
      groupID,
      title: 'سلامتي - إشعار أمان',
      content: `${userName} عاد الى وضع الأمان`,
    });
    let myGroup = allGroups.find((group) => group.groupID == groupID);
    let myUser = myGroup.members.find((user) => user.userID == userID);
    myUser.sos = false;
  }
  getDetails(client: Socket) {
    const token: any = client.handshake.query.authToken;
    const groupID: any = client.handshake.query.groupID;
    const location: any = client.handshake.query.location;
    const { userID, userName } = this.jwtService.verify(token);
    return {
      userID: Number(userID),
      userName,
      groupID,
      socketID: client.id,
      location: JSON.parse(location),
    };
  }

  sendNewLocation(
    groupID: string,
    userID: number,
    location: object,
    sos: boolean,
  ) {
    let myGroup = allGroups.find((group) => group.groupID == groupID);
    myGroup.members.map((user) => {
      if (user.userID != userID && user.socketID != null) {
        this.io.to(user.socketID).emit('location', { userID, location, sos });
      }
    });
  }
}
