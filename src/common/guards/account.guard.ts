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
      const token = request.header('Authorization')?.split(' ')[1];
      if (!token) throw new UnauthorizedException('Invalid token');
      const { userID } = this.jwtService.verify(token);
      if (!(await this.accountRepository.findOneBy({ userID })))
        throw new UnauthorizedException('Invalid token');
      request.user = { userID };
      return true;
    } catch (error) {
      throw new UnauthorizedException('Invalid token');
    }
  }
}
