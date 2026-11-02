import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AccessGuard, type AuthRequest } from '../auth/access.guard.js';
import { ConvexService } from '../convex/convex.service.js';

function object(body: unknown): Record<string, unknown> {
  if (!body || typeof body !== 'object' || Array.isArray(body))
    throw new BadRequestException('Dữ liệu không hợp lệ.');
  return body as Record<string, unknown>;
}
@Controller('api')
export class ShopController {
  constructor(private readonly db: ConvexService) {}
  @Get('admin/products')
  @UseGuards(AccessGuard)
  adminProducts(@Req() req: AuthRequest) {
    return this.db.query('products:adminList', {}, req.authToken);
  }
  @Patch('products/:id/restore')
  @UseGuards(AccessGuard)
  restore(@Param('id') id: string, @Req() req: AuthRequest) {
    return this.db.mutation('products:restore', { id }, req.authToken);
  }
  @Get('users')
  @UseGuards(AccessGuard)
  users(@Req() req: AuthRequest) {
    return this.db.query('users:list', {}, req.authToken);
  }
  @Patch('users/:id/role')
  @UseGuards(AccessGuard)
  userRole(
    @Param('id') id: string,
    @Body() body: unknown,
    @Req() req: AuthRequest,
  ) {
    return this.db.mutation(
      'users:updateRole',
      { ...object(body), id },
      req.authToken,
    );
  }
  @Get('products') products() {
    return this.db.query('products:list');
  }
  @Get('categories') categories() {
    return this.db.query('products:categories');
  }
  @Get('cart')
  @UseGuards(AccessGuard)
  cart(@Req() req: AuthRequest) {
    return this.db.query('cart:list', {}, req.authToken);
  }
  @Post('cart')
  @UseGuards(AccessGuard)
  add(@Body() body: unknown, @Req() req: AuthRequest) {
    return this.db.mutation('cart:add', object(body), req.authToken);
  }
  @Patch('cart/:id')
  @UseGuards(AccessGuard)
  quantity(
    @Param('id') id: string,
    @Body() body: unknown,
    @Req() req: AuthRequest,
  ) {
    return this.db.mutation(
      'cart:setQuantity',
      { ...object(body), id },
      req.authToken,
    );
  }
  @Delete('cart/:id')
  @UseGuards(AccessGuard)
  remove(@Param('id') id: string, @Req() req: AuthRequest) {
    return this.db.mutation('cart:remove', { id }, req.authToken);
  }
  @Get('orders')
  @UseGuards(AccessGuard)
  orders(@Req() req: AuthRequest) {
    return this.db.query('orders:list', {}, req.authToken);
  }
  @Post('orders')
  @UseGuards(AccessGuard)
  place(@Body() body: unknown, @Req() req: AuthRequest) {
    return this.db.mutation('orders:place', object(body), req.authToken);
  }
  @Patch('orders/:id/cancel')
  @UseGuards(AccessGuard)
  cancel(@Param('id') id: string, @Req() req: AuthRequest) {
    return this.db.mutation('orders:cancel', { id }, req.authToken);
  }
  @Patch('orders/:id/status')
  @UseGuards(AccessGuard)
  status(
    @Param('id') id: string,
    @Body() body: unknown,
    @Req() req: AuthRequest,
  ) {
    return this.db.mutation(
      'orders:updateStatus',
      { ...object(body), id },
      req.authToken,
    );
  }
  @Post('categories')
  @UseGuards(AccessGuard)
  category(@Body() body: unknown, @Req() req: AuthRequest) {
    return this.db.mutation(
      'products:createCategory',
      object(body),
      req.authToken,
    );
  }
  @Post('products')
  @UseGuards(AccessGuard)
  create(@Body() body: unknown, @Req() req: AuthRequest) {
    return this.db.mutation('products:create', object(body), req.authToken);
  }
  @Patch('products/:id')
  @UseGuards(AccessGuard)
  metadata(
    @Param('id') id: string,
    @Body() body: unknown,
    @Req() req: AuthRequest,
  ) {
    return this.db.mutation(
      'products:updateMetadata',
      { ...object(body), id },
      req.authToken,
    );
  }
  @Delete('products/:id')
  @UseGuards(AccessGuard)
  hide(@Param('id') id: string, @Req() req: AuthRequest) {
    return this.db.mutation('products:hide', { id }, req.authToken);
  }
  @Post('products/:id/variants')
  @UseGuards(AccessGuard)
  variant(
    @Param('id') productId: string,
    @Body() body: unknown,
    @Req() req: AuthRequest,
  ) {
    return this.db.mutation(
      'products:addVariant',
      { ...object(body), productId },
      req.authToken,
    );
  }
  @Patch('variants/:id')
  @UseGuards(AccessGuard)
  updateVariant(
    @Param('id') id: string,
    @Body() body: unknown,
    @Req() req: AuthRequest,
  ) {
    return this.db.mutation(
      'products:updateVariant',
      { ...object(body), id },
      req.authToken,
    );
  }
}
