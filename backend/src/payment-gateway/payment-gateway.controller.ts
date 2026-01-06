import { Controller, Post, Body, UseGuards, Request } from '@nestjs/common';
import { PaymentGatewayService } from './payment-gateway.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

@Controller('payment-gateway')
export class PaymentGatewayController {
    constructor(private readonly paymentGatewayService: PaymentGatewayService) { }

    @UseGuards(JwtAuthGuard)
    @Post('snap-token')
    async getSnapToken(@Body() body: any, @Request() req) {
        // Body expected: { orderId: string, amount: number, customer: { ... } }

        // Validasi basic
        if (!body.orderId || !body.amount) {
            return { error: 'orderId and amount are required' };
        }

        // Panggil Service Midtrans
        const result = await this.paymentGatewayService.createTransaction(
            body.orderId,
            body.amount,
            body.customer
        );

        return result;
    }

    @Post('notification')
    async handleNotification(@Body() body: any) {
        // Webhook Endpoint for Midtrans
        return this.paymentGatewayService.handleNotification(body);
    }
}
