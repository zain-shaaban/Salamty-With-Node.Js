import { Injectable } from '@nestjs/common';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { FirebaseService } from 'src/firebase/firebase.service';
import { Account } from 'src/account/entities/account.entity';
import { Group } from 'src/group/entities/group.entity';
import { logger } from 'src/common/error_logger/logger.util';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';

@Injectable()
export class NotificationService {
  constructor(
    @InjectRepository(Account) private accountRepository: Repository<Account>,
    @InjectRepository(Group) private groupRepository: Repository<Group>,
    private readonly firebaseService: FirebaseService,
  ) {}

  async sendToGroups({
    userID,
    groupID,
    title,
    content,
  }: CreateNotificationDto): Promise<null | {
    status: boolean;
    message: string;
  }> {
    try {
      let group = await this.groupRepository.findOneBy({ groupID });
      const otherGroupMembers = group.members.filter((user) => user !== userID);
      const accounts = await this.accountRepository.find({
        where: {
          userID: In(otherGroupMembers),
        },
        select: ['notificationToken'],
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

  async sendToUser(
    {userID,title,content}: CreateNotificationDto,
  ): Promise<null | {
    status: boolean;
    message: string;
  }> {
    try {
      const account = await this.accountRepository.findOne({
        where: {
          userID,
        },
        select: ['notificationToken'],
      });

      const message = {
        token: account.notificationToken,
        notification: {
          title,
          body: content,
        },
      };

      await this.firebaseService.messaging().send(message);
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
