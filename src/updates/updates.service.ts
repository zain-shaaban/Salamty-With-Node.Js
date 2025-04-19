import { HttpException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Update } from './entities/update.entity';

@Injectable()
export class UpdatesService {
  constructor(
    @InjectRepository(Update)
    private readonly updateRepository: Repository<Update>,
  ) {}

  async check({ appVersion, infoVersion }) {
    const update = await this.updateRepository.findOne({
      where: {},
      select: ['appVersion', 'infoVersion', 'infoContent'],
    });

    const updates = {
      forceUpdate: false,
      infoVersion: null,
      infoContent: null,
    };

    if (this.needsUpdate(update.appVersion, appVersion)) {
      updates.forceUpdate = true;
      return updates;
    }

    if (this.needsUpdate(update.infoVersion, infoVersion)) {
      updates.infoContent = update.infoContent;
      updates.infoVersion = update.infoVersion;
      return updates;
    }

    return {};
  }

  private needsUpdate(
    currentVersion: string,
    receivedVersion: string,
  ): boolean {
    const currentParts = currentVersion.split('.').map(Number);
    const receivedParts = receivedVersion.split('.').map(Number);

    for (
      let i = 0;
      i < Math.max(currentParts.length, receivedParts.length);
      i++
    ) {
      const currentPart = currentParts[i] || 0;
      const receivedPart = receivedParts[i] || 0;

      if (currentPart > receivedPart) {
        return true;
      }
      if (currentPart < receivedPart) {
        throw new Error(
          `Invalid version comparison: current ${currentVersion} is less than received ${receivedVersion}`,
        );
      }
    }

    return false;
  }
}
