import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserDto, CreateUserSchema } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import {
  ApiBody,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
} from '@nestjs/swagger';
import { ResponseUserDto } from './dto/response-user.dto';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post()
  @ApiBody({
    description: 'Create a new user',
    schema: {
      example: {
        email: 'admin@gate-qris.com',
        password: 'StrongPassword123!',
        name: 'Admin Gate QRIS',
      },
    },
  })
  @ApiCreatedResponse({
    description: 'User created successfully',
    type: ResponseUserDto,
  })
  create(
    @Body(new ZodValidationPipe(CreateUserSchema)) createUserDto: CreateUserDto,
  ) {
    return this.userService.create(createUserDto);
  }

  @Get()
  @ApiOkResponse({
    description: 'List of users',
    type: [ResponseUserDto],
  })
  @ApiNotFoundResponse({
    description: 'No users found',
  })
  findAll() {
    return this.userService.findAll();
  }

  @Get(':id')
  @ApiOkResponse({
    description: 'User found successfully',
    type: ResponseUserDto,
  })
  @ApiNotFoundResponse({
    description: 'User not found',
  })
  findOne(@Param('id') id: string) {
    return this.userService.findOne(id);
  }

  @Patch(':id')
  @ApiBody({
    description: 'Update a user',
    schema: {
      example: {
        email: 'admin@gate-qris.com',
        password: 'StrongPassword123!',
        name: 'Admin Gate QRIS',
      },
    },
  })
  @ApiOkResponse({
    description: 'User updated successfully',
    type: ResponseUserDto,
  })
  @ApiNotFoundResponse({
    description: 'User not found',
  })
  update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.userService.update(id, updateUserDto);
  }

  @Delete(':id')
  @ApiOkResponse({
    description: 'User deleted successfully',
    type: ResponseUserDto,
  })
  @ApiNotFoundResponse({
    description: 'User not found',
  })
  remove(@Param('id') id: string) {
    return this.userService.remove(id);
  }
}
