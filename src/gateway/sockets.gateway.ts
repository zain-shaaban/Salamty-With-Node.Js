import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  ConnectedSocket,
  MessageBody,
  OnGatewayInit,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { logger } from 'src/common/error_logger/logger.util';
import { SocketsService } from './sockets.service';

@WebSocketGateway()
export class SocketsGateway
  implements OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit
{
  @WebSocketServer()
  io: Server;

  constructor(private socketsService: SocketsService) {}

  afterInit() {
    this.socketsService.setSocketServer(this.io);
  }

  async handleConnection(client: Socket) {
    try {
      await this.socketsService.handleUserConnection(client);
      return { status: true };
    } catch (error) {
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    try {
      this.socketsService.handleUserDisconnect(client);
      return {
        status: true,
      };
    } catch (error) {
      logger.error(error.message, error.stack);
      return {
        status: false,
        message: error.message,
      };
    }
  }

  @SubscribeMessage('sos')
  sosMode(@ConnectedSocket() client: Socket) {
    try {
      this.socketsService.handleSosMode(client);
      return {
        status: true,
      };
    } catch (error) {
      logger.error(error.message, error.stack);
      return {
        status: false,
        message: error.message,
      };
    }
  }

  @SubscribeMessage('endsos')
  endsosMode(@ConnectedSocket() client: Socket) {
    try {
      this.socketsService.handleEndSosMode(client);
      return {
        status: true,
      };
    } catch (error) {
      logger.error(error.message, error.stack);
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
      this.socketsService.handleNewTrip(client, destination);
      return {
        status: true,
      };
    } catch (error) {
      logger.error(error.message, error.stack);
      return {
        status: false,
        message: error.message,
      };
    }
  }

  @SubscribeMessage('changeTime')
  changeTimeForTrip(
    @ConnectedSocket() client: Socket,
    @MessageBody() changeTimeData: { increase: boolean; amount: number },
  ) {
    try {
      this.socketsService.handleChangeTimeForTrip(client, changeTimeData);
      return {
        status: true,
      };
    } catch (error) {
      logger.error(error.message, error.stack);
      return {
        status: false,
        message: error.message,
      };
    }
  }

  @SubscribeMessage('endTrip')
  endTrip(@ConnectedSocket() client: Socket) {
    try {
      this.socketsService.handleEndTrip(client);
      return {
        status: true,
      };
    } catch (error) {
      logger.error(error.message, error.stack);
      return {
        status: false,
        message: error.message,
      };
    }
  }
}
