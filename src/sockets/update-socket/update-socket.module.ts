import { Module } from '@nestjs/common';
import { UpdateSocketGateway } from './update-socket.gateway';

@Module({
  providers: [UpdateSocketGateway],
  exports: [UpdateSocketGateway],
})
export class UpdateSocketModule {}
