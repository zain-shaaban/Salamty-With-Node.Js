import { Controller, Post, Body } from '@nestjs/common';
import { UpdatesService } from './updates.service';
import { asyncHandler } from 'src/common/utils/async-handler';
import { CheckUpdateDto } from './dto/check-updates.dto';

@Controller('updates')
export class UpdatesController {
  constructor(private readonly updatesService: UpdatesService) {}

  @Post()
  async check(@Body() checkUpdateDto: CheckUpdateDto) {
    return await asyncHandler(this.updatesService.check(checkUpdateDto));
  }
}
