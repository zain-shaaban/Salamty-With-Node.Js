import { WebSocketGateway, SubscribeMessage, MessageBody, OnGatewayConnection } from '@nestjs/websockets';
import { CreateSocketDto } from './dto/create-socket.dto';
import { UpdateSocketDto } from './dto/update-socket.dto';

@WebSocketGateway()
export class SocketsGateway implements OnGatewayConnection{
  handleConnection(client: any, ...args: any[]) {
    
  }

  @SubscribeMessage('createSocket')
  create(@MessageBody() createSocketDto: CreateSocketDto) {
    return 
  }

  @SubscribeMessage('findAllSockets')
  findAll() {
    return 
  }

  @SubscribeMessage('findOneSocket')
  findOne(@MessageBody() id: number) {
    return 
  }

  @SubscribeMessage('updateSocket')
  update(@MessageBody() updateSocketDto: UpdateSocketDto) {
    return 
  }

  @SubscribeMessage('removeSocket')
  remove(@MessageBody() id: number) {
    return 
  }
}
