import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Account } from 'src/account/entities/account.entity';
import { Repository } from 'typeorm';

@Injectable()
export class AccountAuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    @InjectRepository(Account) private accountRepository: Repository<Account>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    try {
      const request = context.switchToHttp().getRequest();
      const authHeader = request.header('Authorization');
      if (!authHeader?.startsWith('Bearer '))
        throw new UnauthorizedException('Invalid token');

      const token = authHeader.split(' ')[1];
      const payload = this.jwtService.verify(token);

      const user = await this.accountRepository.findOneBy({
        userID: payload.userID,
      });
      if (!user) throw new UnauthorizedException('Invalid token');

      request.user = { userID: payload.userID };
      return true;
    } catch (error) {
      console.log('Hello');
      throw new UnauthorizedException('Invalid token');
    }
  }
}
