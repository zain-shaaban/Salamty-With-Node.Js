import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { UpdatesService } from './updates.service';
import { AccountAuthGuard } from 'src/common/guards/account.guard';

// @UseGuards(AccountAuthGuard)
@Controller('updates')
export class UpdatesController {
  constructor(private readonly updatesService: UpdatesService) {}

  @Post()
  async create(@Body() { appVersion, infoVersion }) {
    return await this.updatesService.check({ appVersion, infoVersion });
  }
}