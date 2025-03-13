import { Inject } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/sequelize';
import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Account } from 'src/account/entities/account.entity';

import { ErrorLoggerService } from 'src/common/error_logger/error_logger.service';
import { NotificationService } from 'src/notification/notification.service';

export let onlineUsers: any = [];

function deleteOfflineUsersFromAllGroups() {
  const groups = {};
  onlineUsers.forEach((user) => {
    if (!groups[user.groupID]) {
      groups[user.groupID] = [];
    }
    groups[user.groupID].push(user);
  });

  for (const groupID in groups) {
    const groupUsers = groups[groupID];
    const allOffline = groupUsers.every((user) => user.offline === true);
    if (allOffline) {
      onlineUsers = onlineUsers.filter((user) => user.groupID != groupID);
    }
  }
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
    @Inject() private readonly notificationService: NotificationService,
    private readonly jwtService: JwtService,
  ) {
    setInterval(async () => {
      onlineUsers = await Promise.all(
        onlineUsers.map(async (user) => {
          if (
            Date.now() - user.location.time > 1000 * 60 &&
            user.socketID == null
          ) {
            user.offline = true;
            await this.accountModel.update(
              { lastLocation: user.location },
              { where: { userID: user.userID } },
            );
            return user;
          } else if (
            Date.now() - user.location.time > 1000 * 30 &&
            user.socketID == null &&
            user.notificationSent == false
          ) {
            user.notificationSent = true;
            this.notificationService.send({
              groupID: user.groupID,
              title: 'سلامتي - إشعار تفقد',
              content: `لم يرسل ${user.username} موقعه منذ 30 دقيقة`,
            });
            return user;
          } else {
            return user;
          }
        }),
      );
      deleteOfflineUsersFromAllGroups();
    }, 1000 * 20);
  }

  handleConnection(client: Socket) {
    try {
      const { userID, username, location, groupID } = this.getDetails(client);
      let user = onlineUsers.find((user) => user.userID == userID);
      if (!user) {
        onlineUsers.push({
          socketID: client.id,
          username,
          groupID,
          userID,
          location,
          notificationSent: false,
          offline: false,
        });
      } else {
        user.socketID = client.id;
        user.location = location;
        user.notificationSent = false;
        user.offline = false;
      }
      client.join(groupID);
      return { status: true };
    } catch (error) {
      this.logger.error(error.message, error.stack);
      return {
        status: false,
        message: error.message,
      };
    }
  }

  handleDisconnect(client: Socket) {
    try {
      let user = onlineUsers.find((user) => user.socketID == client.id);
      if (user) {
        user.socketID = null;
      }
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

  getDetails(client: Socket) {
    const token: any = client.handshake.query.authToken;
    const groupID: any = client.handshake.query.groupID;
    const location: any = client.handshake.query.location;
    const { userID, username } = this.jwtService.verify(token);
    return {
      userID: Number(userID),
      username,
      groupID,
      location: JSON.parse(location),
    };
  }

  sendNewLocation(groupID: string, userID: number, location: object) {
    this.io.to(groupID).emit('location', { userID, location });
  }
}
