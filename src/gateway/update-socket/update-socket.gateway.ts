import { JwtService } from '@nestjs/jwt';
import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Namespace, Socket } from 'socket.io';
import { logger } from 'src/common/error_logger/logger.util';

interface UserSocketPairs {
  userID: string;
  socketID: string;
}

@WebSocketGateway({
  namespace: 'updates',
  cors: {
    origin: '*',
  },
})
export class UpdateSocketGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  io: Namespace;

  private userSockets: UserSocketPairs[] = [];

  constructor(private readonly jwtService: JwtService) {}

  handleConnection(client: Socket): void {
    try {
      const token = client.handshake.query.authToken as string;
      const { userID } = this.jwtService.verify(token);
      this.userSockets.push({ userID, socketID: client.id });
    } catch (error) {
      logger.error(error.message, error.stack);
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket): void {
    try {
      this.userSockets = this.userSockets.filter(
        (user) => user.socketID !== client.id,
      );
    } catch (error) {
      logger.error(error.message, error.stack);
      client.disconnect();
    }
  }

  newGroup(userID: string): void {
    this.emitToUser(userID, 'groupChange');
  }

  joinedGroup(members: string[]): void {
    this.emitToUsers(members, 'groupChange');
  }

  leftGroup(members: string[]): void {
    this.emitToUsers(members, 'groupChange');
  }

  private emitToUser(userID: string, event: string): void {
    const user = this.userSockets.find((user) => user.userID === userID);
    if (user) {
      this.io.to(user.socketID).emit(event);
    }
  }

  private emitToUsers(members: string[], event: string): void {
    const userIDSet = new Set(members);
    this.userSockets.forEach((user) => {
      if (userIDSet.has(user.userID)) this.io.to(user.socketID).emit(event);
    });
  }
}
