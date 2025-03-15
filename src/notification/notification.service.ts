import { Injectable, Logger } from '@nestjs/common';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { InjectModel } from '@nestjs/sequelize';
import { FirebaseService } from 'src/firebase/firebase.service';
import { Account } from 'src/account/entities/account.entity';
import { Group } from 'src/group/entities/group.entity';
import { Op } from 'sequelize';
import { logger } from 'src/common/error_logger/logger.util';

@Injectable()
export class NotificationService {
  constructor(
    @InjectModel(Account) private readonly accountModel: typeof Account,
    @InjectModel(Group) private readonly groupModel: typeof Group,
    private readonly firebaseService: FirebaseService,
  ) {}

  async send(createNotificationDto: CreateNotificationDto) {
    try {
      const { groupID, title, content } = createNotificationDto;
      let group = await this.groupModel.findByPk(groupID);
      const accounts = await this.accountModel.findAll({
        where: {
          userID: { [Op.in]: group.members },
        },
        attributes: ['notificationToken'],
      });
      await Promise.all(
        accounts.map(async (account) => {
          const message = {
            token: account.notificationToken,
            notification: {
              title,
              body: content,
            },
          };
          await this.firebaseService.messaging().send(message);
        }),
      );
      return null;
    } catch (error) {
      logger.error(error.message, error.stack);
      return {
        status: false,
        message: error.message,
      };
    }
  }
}
