import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/sequelize';
import { Account } from 'src/account/entities/account.entity';

@Injectable()
export class AccountAuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    @InjectModel(Account) private accountModel: typeof Account,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    try {
      const request = context.switchToHttp().getRequest();
      const token = request.header('Authorization')?.split(' ')[1];
      if (!token) throw new UnauthorizedException('Invalid token');
      const { userID } = this.jwtService.verify(token);
      if (!(await this.accountModel.findByPk(userID)))
        throw new UnauthorizedException('Invalid token');
      request.user = { userID };
      return true;
    } catch (error) {
      throw new UnauthorizedException('Invalid token');
    }
  }
}
