import { Controller, Post, Body } from '@nestjs/common';
import { NotificationService } from './notification.service';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { asyncHandler } from 'src/common/utils/async-handler';

@Controller('notification')
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @Post('send')
  async create(@Body() createNotificationDto: CreateNotificationDto) {
    return await asyncHandler(
      this.notificationService.sendToGroups(createNotificationDto),
    );
  }
}
