import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { PrismaModule } from 'src/prisma/prisma.module';
import { RolesGuard } from '../auth/guard/roles.guard';

@Module({
  controllers: [UserController],
  providers: [UserService, RolesGuard],
  imports: [PrismaModule],
})
export class UserModule {}
