import { JwtService } from '@nestjs/jwt';
import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Namespace, Socket } from 'socket.io';
import { logger } from 'src/common/error_logger/logger.util';

let idPairs = [];

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

  constructor(private readonly jwtService: JwtService) {}

  handleConnection(client: Socket) {
    try {
      const socketID = client.id;
      const token: any = client.handshake.query.authToken;
      const { userID } = this.jwtService.verify(token);
      idPairs.push({ userID, socketID });
    } catch (error) {
      logger.error(error.message, error.stack);
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    try {
      const socketID = client.id;
      idPairs = idPairs.filter((user) => user.socketID != socketID);
    } catch (error) {
      logger.error(error.message, error.stack);
      client.disconnect();
    }
  }

  newGroup(userID: string) {
    const { socketID } = idPairs.find((user) => user.userID == userID);
    this.io.to(socketID).emit('newGroup');
  }

  joinedGroup(members: string[]) {
    idPairs.map((user) => {
      if (members.find((userID) => userID == user.userID))
        this.io.to(user.socketID).emit('joinedGroup');
    });
  }

  leftGroup(members: string[]) {
    idPairs.map((user) => {
      if (members.find((userID) => userID == user.userID))
        this.io.to(user.socketID).emit('leftGroup');
    });
  }
}
