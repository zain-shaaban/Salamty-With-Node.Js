import { Inject, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Interval } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Socket } from 'socket.io';
import { Account } from 'src/account/entities/account.entity';
import { Group } from 'src/group/entities/group.entity';
import { NotificationService } from 'src/notification/notification.service';
import { In, Repository } from 'typeorm';
import {
  GroupSession,
  LocationType,
  UserType,
} from './interfaces/group.interface';
import { Server } from 'socket.io';
import { logger } from 'src/common/error_logger/logger.util';

interface Destination {
  coords: { lat: number; lng: number };
  estimatedTime: number;
}

interface ChangeTime {
  increase: boolean;
  amount: number;
}

@Injectable()
export class SocketsService {
  private io: Server;
  public allGroups: GroupSession[] = [];

  constructor(
    @InjectRepository(Account) private accountRepository: Repository<Account>,
    @InjectRepository(Group) private groupRepository: Repository<Group>,
    @Inject() private readonly notificationService: NotificationService,
    private readonly jwtService: JwtService,
  ) {}

  async handleUserConnection(client: Socket) {
    const { userID, groupID, socketID, location, userName } =
      this.getDetails(client);

    const group = await this.groupRepository.findOneBy({ groupID });

    if (!group || !group.members.includes(userID)) {
      client.disconnect();
      return;
    }

    let myGroup: GroupSession = this.allGroups.find(
      (g) => g.groupID === groupID,
    );
    if (!myGroup) {
      myGroup = await this.createNewGroup(group, userID, socketID, location);
      this.allGroups.push(myGroup);
    } else {
      await this.updateExistingGroup(
        myGroup,
        userID,
        socketID,
        location,
        userName,
      );
    }

    client.join(groupID);

    this.handleOnConnectionEvent(client, myGroup, userID);
    this.sendNewLocation(
      myGroup.groupID,
      userID,
      location,
      myGroup.members?.find((m) => m.userID === userID)?.sos,
    );
  }

  handleUserDisconnect(client: Socket) {
    const { groupID, userID } = this.getDetails(client);
    const group = this.allGroups.find((g) => g.groupID === groupID);
    group.members.find((m) => m.userID === userID).socketID = null;
  }

  handleSosMode(client: Socket) {
    const { userID, userName, groupID } = this.getDetails(client);
    this.notificationService.sendToGroup({
      userID,
      groupID,
      title: 'سلامتي - إشعار خطر',
      content: `${userName} في وضع الخطر`,
    });
    const group = this.allGroups.find((g) => g.groupID === groupID);
    group.members.find((m) => m.userID === userID).sos = true;
  }

  handleEndSosMode(client: Socket) {
    const { userID, userName, groupID } = this.getDetails(client);
    this.notificationService.sendToGroup({
      userID,
      groupID,
      title: 'سلامتي - إشعار أمان',
      content: `${userName} عاد الى وضع الأمان`,
    });
    let group = this.allGroups.find((g) => g.groupID === groupID);
    let user = group.members.find((u) => u.userID === userID);
    user.sos = false;
    if (Object.keys(user.destination).length > 0) {
      user.destination = <any>{};
      client.broadcast.to(groupID).emit('endTrip', { userID });
      this.accountRepository.update(userID, { destination: {} });
    }
  }

  handleNewTrip(client: Socket, destination: Destination) {
    const { userID, groupID } = this.getDetails(client);
    const group = this.allGroups.find((g) => g.groupID === groupID);
    group.members.find((m) => m.userID === userID).destination = destination;
    client.broadcast.to(groupID).emit('newTrip', { userID, destination });
  }

  handleEndTrip(client: Socket) {
    const { userID, groupID } = this.getDetails(client);
    const group = this.allGroups.find((g) => g.groupID === groupID);
    if (!group) throw new Error(`Group ${groupID} not found`);

    const user = group.members.find((u) => u.userID === userID);
    if (!user) throw new Error(`User ${userID} not found`);

    if (!user.destination || Object.keys(user.destination).length === 0)
      throw new Error(`Trip does not exist`);

    user.destination = <any>{};
    this.accountRepository.update(userID, { destination: {} });

    client.broadcast.to(groupID).emit('endTrip', { userID });
  }

  handleChangeTimeForTrip(client: Socket, { increase, amount }: ChangeTime) {
    const { userID, groupID } = this.getDetails(client);
    const group = this.allGroups.find((g) => g.groupID === groupID);
    if (!group) throw new Error(`Group ${groupID} not found`);

    const user = group.members.find((u) => u.userID === userID);
    if (!user) throw new Error(`User ${userID} not found`);

    const destination = user.destination;
    if (!destination || Object.keys(destination).length === 0)
      throw new Error('Trip does not exist');
    const operator = increase ? 1 : -1;
    destination.estimatedTime += operator * amount;
    client.broadcast.to(groupID).emit('destinationTimeChange', {
      userID,
      estimatedTime: destination.estimatedTime,
    });
  }

  private deleteOfflineUsersFromAllGroups() {
    this.allGroups = this.allGroups.filter((group) =>
      group.members.some((user) => !user.offline),
    );
  }

  private getDetails(client: Socket) {
    const { groupID, location, authToken } = client.handshake.query;
    const { userID, userName } = this.jwtService.verify(authToken as string);
    return {
      userID,
      userName,
      groupID: groupID as string,
      socketID: client.id,
      location: JSON.parse(location as string),
    };
  }

  private async createNewGroup(
    group: Group,
    userID: string,
    socketID: string,
    location: LocationType,
  ): Promise<GroupSession> {
    const membersData = await this.accountRepository.find({
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
    const members: UserType[] = membersData.map((user) => {
      const lastLocation = user.lastLocation.find(
        (loc) => loc.groupID === group.groupID,
      )?.location;
      const isCurrent = user.userID === userID;
      const isInGroup = user.destination?.groupID === group.groupID;
      const isSosActive = user.path?.groupID === group.groupID;
      if (lastLocation || isCurrent)
        return {
          userID: user.userID,
          userName: user.userName,
          socketID: isCurrent ? socketID : null,
          location: isCurrent ? location : lastLocation,
          notificationSent: isCurrent ? false : true,
          offline: !isCurrent,
          sos: isSosActive ? user.sos : false,
          path: isSosActive ? user.path?.path : [],
          destination: isInGroup ? user.destination?.destination : <any>{},
          notificationDes: false,
        };
    });
    return {
      groupID: group.groupID,
      groupName: group.groupName,
      members: members.filter((m) => Boolean(m)),
    };
  }

  private async updateExistingGroup(
    group: GroupSession,
    userID: string,
    socketID: string,
    location: LocationType,
    userName: string,
  ) {
    const member = group.members.find((u) => u.userID === userID);
    if (member) {
      if (member.sos) member.path.push(location);
      Object.assign(member, {
        socketID,
        location,
        notificationSent: false,
        notificationDes: false,
        offline: false,
      });
    } else {
      group.members.push({
        userID,
        userName,
        socketID,
        location,
        notificationSent: false,
        offline: false,
        sos: false,
        path: [],
        destination: <any>{},
        notificationDes: false,
      });
    }
  }

  private handleOnConnectionEvent(
    client: Socket,
    myGroup: GroupSession,
    userID: string,
  ) {
    let currentUser = myGroup?.members?.find((u) => u.userID === userID);

    const groupMembers =
      myGroup?.members?.map(({ userID, location, sos, path, destination }) => ({
        userID,
        location,
        sos,
        path,
        destination,
      })) ?? [];

    client.emit('onConnection', {
      groupMembers: groupMembers.filter((m) => m.userID !== userID) ?? [],
      session: {
        sos: currentUser?.sos,
        destination: currentUser?.destination,
      },
    });
  }

  sendNewLocation(
    groupID: string,
    userID: string,
    location: LocationType,
    sos: boolean,
  ) {
    let group = this.allGroups.find((g) => g.groupID == groupID);
    group.members
      .filter((member) => member.userID !== userID && member.socketID)
      .forEach(({ socketID }) => {
        this.io.to(socketID).emit('location', { userID, location, sos });
      });
  }

  @Interval(60000)
  private async intervalOnGroups() {
    this.allGroups = await Promise.all(
      this.allGroups.map((group) => this.processGroup(group)),
    );
    this.deleteOfflineUsersFromAllGroups();
  }

  private async processGroup(group: GroupSession) {
    const members = await Promise.all(
      group.members.map((user) => this.processUser(user, group)),
    );
    return { ...group, members };
  }

  private async processUser(user: UserType, group: GroupSession) {
    const now = Date.now();
    if (this.shouldSendDestinationReminder(user, now)) {
      user.notificationDes = true;
      this.notificationService.sendToUser({
        userID: user.userID,
        title: 'سلامتي - إشعار تفقد',
        groupID: null,
        content: `بقي أقل من 5 دقائق على نهاية رحلتك، هل تريد زيادة المدة؟`,
      });
    }

    if (this.shouldTriggerSos(user, now)) {
      user.sos = true;
      this.notificationService.sendToGroup({
        userID: user.userID,
        groupID: group.groupID,
        title: 'سلامتي - إشعار خطر',
        content: `${user.userName} في وضع الخطر`,
      });
    }

    if (this.shouldMarkOffline(user, now)) {
      user.offline = true;
      const account = await this.accountRepository.findOneBy({
        userID: user.userID,
      });
      const otherLocations = account.lastLocation.filter(
        (loc) => loc.groupID !== group.groupID,
      );
      account.lastLocation = [
        ...otherLocations,
        { groupID: group.groupID, location: user.location },
      ];

      account.sos = user.sos;

      if (Object.keys(user.destination).length > 0) {
        account.destination = {
          groupID: group.groupID,
          destination: user.destination,
        };
      }

      if (user.sos) account.path = { groupID: group.groupID, path: user.path };

      await this.accountRepository.save(account);
    }

    if (this.shouldSendInactivityNotification(user, now)) {
      user.notificationSent = true;
      this.notificationService.sendToGroup({
        userID: user.userID,
        groupID: group.groupID,
        title: 'سلامتي - إشعار تفقد',
        content: `لم يرسل ${user.userName} موقعه ل ${group.groupName} منذ 30 دقيقة`,
      });
    }
    return user;
  }

  private shouldSendDestinationReminder(user: UserType, now: number): boolean {
    return (
      user.destination?.estimatedTime < now + 5 * 60 * 1000 &&
      !user.notificationDes
    );
  }

  private shouldTriggerSos(user: UserType, now: number) {
    return user.destination?.estimatedTime < now && !user.sos;
  }

  private shouldMarkOffline(user: UserType, now: number) {
    return (
      user.location.time < now - 45 * 60 * 1000 &&
      !user.socketID &&
      !user.offline
    );
  }

  private shouldSendInactivityNotification(user: UserType, now: number) {
    return (
      user.location.time < now - 30 * 60 * 1000 &&
      !user.socketID &&
      !user.notificationSent
    );
  }

  setSocketServer(server: Server) {
    this.io = server;
  }
}
