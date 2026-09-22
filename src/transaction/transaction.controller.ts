import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import type { Response } from 'express';
import { Status } from '../../generated/prisma/enums';
import { TransactionService } from './transaction.service';
import { JwtAuthGuard } from '../auth/guard/jwt-guard.auth';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';

@Controller('transaction')
export class TransactionController {
  constructor(private readonly transactionService: TransactionService) {}

  @Post()
  create(@Body() createTransactionDto: CreateTransactionDto) {
    return this.transactionService.create(createTransactionDto);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiQuery({
    name: 'status',
    required: false,
    enum: Object.values(Status),
    description: 'Filter transactions by local payment status',
  })
  findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('status') status?: string,
  ) {
    return this.transactionService.findAll(
      Number(page),
      Number(limit),
      status,
    );
  }

  @Get('export')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async exportExcel(@Res() response: Response) {
    const workbook = await this.transactionService.exportExcel();
    response.set({
      'Content-Type':
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': 'attachment; filename="transactions.xlsx"',
    });
    response.send(workbook);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.transactionService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateTransactionDto: UpdateTransactionDto,
  ) {
    return this.transactionService.update(+id, updateTransactionDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.transactionService.remove(+id);
  }
}
