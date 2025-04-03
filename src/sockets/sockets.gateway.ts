import { Inject, Logger, NotFoundException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Account } from 'src/account/entities/account.entity';

import { ErrorLoggerService } from 'src/common/error_logger/error_logger.service';
import { Group } from 'src/group/entities/group.entity';
import { NotificationService } from 'src/notification/notification.service';
import { In, Repository } from 'typeorm';

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
    @InjectRepository(Account) private accountRepository: Repository<Account>,
    @InjectRepository(Group) private groupRepository: Repository<Group>,
    @Inject() private readonly notificationService: NotificationService,
    private readonly jwtService: JwtService,
  ) {
    setInterval(async () => {
      allGroups = await Promise.all(
        allGroups.map(async (group) => {
          group.members = await Promise.all(
            group.members.map(async (user) => {
              if (
                user.destination?.estimatedTime < Date.now() - 1000 * 60 * 5 &&
                user.notificationDes == false
              ) {
                user.notificationDes = true;
                this.notificationService.sendToUser({
                  userID: user.userID,
                  title: 'سلامتي - إشعار تفقد',
                  groupID: null,
                  content: `بقي 5 دقائق على نهاية رحلتك, هل تريد تعديل المدة؟`,
                });
              }
              if (
                user.destination?.estimatedTime < Date.now() &&
                user.sos == false
              ) {
                user.sos = true;
                this.notificationService.sendToGroups({
                  userID: user.userID,
                  groupID: group.groupID,
                  title: 'سلامتي - إشعار خطر',
                  content: `${user.userName} في وضع الخطر`,
                });
              }
              if (
                Date.now() - user.location.time > 1000 * 60 &&
                user.socketID == null &&
                user.offline == false
              ) {
                user.offline = true;
                let account = await this.accountRepository.findOneBy({
                  userID: user.userID,
                });
                let locationsArray = account.lastLocation.filter(
                  (oneGroup) => oneGroup.groupID != group.groupID,
                );
                locationsArray = [
                  ...locationsArray,
                  { groupID: group.groupID, location: user.location },
                ];
                if (user.sos) {
                  account.lastLocation = locationsArray;
                  account.sos = user.sos;
                  account.path = { groupID: group.groupID, path: user.path };
                  if (Object.keys(user.destination).length > 0)
                    account.destination = {
                      groupID: group.groupID,
                      destination: user.destination,
                    };
                  await this.accountRepository.save(account);
                } else {
                  account.lastLocation = locationsArray;
                  account.sos = user.sos;
                  if (Object.keys(user.destination).length > 0)
                    account.destination = {
                      groupID: group.groupID,
                      destination: user.destination,
                    };
                  await this.accountRepository.save(account);
                }
                return user;
              } else if (
                Date.now() - user.location.time > 1000 * 30 &&
                user.socketID == null &&
                user.notificationSent == false
              ) {
                user.notificationSent = true;
                this.notificationService.sendToGroups({
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
      const group = await this.groupRepository.findOneBy({ groupID });
      if (!group || !group.members.find((id) => id == userID))
        client.disconnect();
      let myGroup = allGroups.find((group) => group.groupID == groupID);
      if (!myGroup) {
        myGroup = { groupID, groupName: group.groupName, members: [] };
        const members = await this.accountRepository.find({
          where: { userID: In(group.members) },
          select: [
            'userID',
            'userName',
            'lastLocation',
            'sos',
            'destination',
            'path',
          ],
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
                  destination:
                    user.destination?.groupID == groupID
                      ? user.destination.destination
                      : {},
                  notificationDes: false,
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
                  destination:
                    user.destination?.groupID == groupID
                      ? user.destination.destination
                      : {},
                  notificationDes: false,
                });
          } else {
            if (user.sos) {
              user.path.path.push(location);
              myGroup.members.push({
                userID,
                socketID,
                userName,
                location,
                notificationSent: false,
                offline: false,
                sos: user.sos,
                path: user.path.path,
                destination:
                  user.destination?.groupID == groupID
                    ? user.destination.destination
                    : {},
                notificationDes: false,
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
                destination:
                  user.destination?.groupID == groupID
                    ? user.destination.destination
                    : {},
                notificationDes: false,
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
          user.notificationDes = false;
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
            destination: {},
            notificationDes: false,
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
          destination: user.destination,
        };
        return myUser;
      });
      let user = myGroup.members.find((user) => user.userID == userID);
      client.emit('onConnection', {
        groupMembers: allGroupMembers.filter((user) => user.userID != userID),
        session: { sos: user.sos, destination: user.destination },
      });
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
    try {
      const { userID, userName, groupID } = this.getDetails(client);
      this.notificationService.sendToGroups({
        userID,
        groupID,
        title: 'سلامتي - إشعار خطر',
        content: `${userName} في وضع الخطر`,
      });
      let myGroup = allGroups.find((group) => group.groupID == groupID);
      let myUser = myGroup.members.find((user) => user.userID == userID);
      myUser.sos = true;
    } catch (error) {
      this.logger.error(error.message, error.stack);
      return {
        status: false,
        message: error.message,
      };
    }
  }

  @SubscribeMessage('endsos')
  async endsosMode(@ConnectedSocket() client: Socket) {
    try {
      const { userID, userName, groupID } = this.getDetails(client);
      this.notificationService.sendToGroups({
        userID,
        groupID,
        title: 'سلامتي - إشعار أمان',
        content: `${userName} عاد الى وضع الأمان`,
      });
      let myGroup = allGroups.find((group) => group.groupID == groupID);
      let myUser = myGroup.members.find((user) => user.userID == userID);
      myUser.sos = false;
    } catch (error) {
      this.logger.error(error.message, error.stack);
      return {
        status: false,
        message: error.message,
      };
    }
  }

  @SubscribeMessage('newTrip')
  submitNewTrip(
    @ConnectedSocket() client: Socket,
    @MessageBody()
    destination: {
      coords: { lat: number; lng: number };
      estimatedTime: number;
    },
  ) {
    try {
      const { userID, groupID } = this.getDetails(client);
      let myGroup = allGroups.find((group) => group.groupID == groupID);
      let myUser = myGroup.members.find((user) => user.userID == userID);
      myUser.destination = destination;
      client.broadcast.to(groupID).emit('newTrip', { userID, destination });
      return {
        status: true,
        data: true,
      };
    } catch (error) {
      this.logger.error(error.message, error.stack);
      return {
        status: false,
        message: error.message,
      };
    }
  }

  @SubscribeMessage('changeTime')
  changeTimeForTrip(
    @ConnectedSocket() client: Socket,
    @MessageBody() changeTimeData: { increate: boolean; amount: number },
  ) {
    try {
      const { userID, groupID } = this.getDetails(client);
      let myGroup = allGroups.find((group) => group.groupID == groupID);
      let myUser = myGroup.members.find((user) => user.userID == userID);
      if (Object.keys(myUser.destination).length == 0)
        throw new Error('the trip does not exist');
      if (changeTimeData.increate == true)
        myUser.destination.estimatedTime =
          myUser.destination.estimatedTime + changeTimeData.amount;
      else
        myUser.destination.estimatedTime =
          myUser.destination.estimatedTime - changeTimeData.amount;
      return {
        status: true,
        data: null,
      };
    } catch (error) {
      this.logger.error(error.message, error.stach);
      return {
        status: false,
        message: error.message,
      };
    }
  }

  @SubscribeMessage('endTrip')
  endTrip(@ConnectedSocket() client: Socket) {
    try {
      const { userID, groupID } = this.getDetails(client);
      let myGroup = allGroups.find((group) => group.groupID == groupID);
      let myUser = myGroup.members.find((user) => user.userID == userID);
      if (Object.keys(myUser.destination).length == 0)
        throw new Error('the trip does not exist');
      myUser.destination = {};
      client.broadcast.to(groupID).emit('endTrip', { userID });
      this.accountRepository.update(userID, { destination: {} });
      return {
        status: true,
        data: null,
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
    const { userID, userName } = this.jwtService.verify(token);
    this.logger.error('FROM CONSOLE LOCATION', location);
    this.logger.error('FROM CONSOLE GROUP ID', groupID);
    this.logger.error('FROM CONSOLE USER ID', userID);
    return {
      userID: userID,
      userName,
      groupID,
      socketID: client.id,
      location: JSON.parse(location),
    };
  }

  sendNewLocation(
    groupID: string,
    userID: string,
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
