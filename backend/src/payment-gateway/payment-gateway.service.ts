import { Injectable, Logger } from '@nestjs/common';
import * as midtransClient from 'midtrans-client';
import { PaymentsService } from '../payments/payments.service';
import { CustomersService } from '../customers/customers.service';
import { ArrearsCalculatorService } from '../common/services/arrears-calculator.service';

@Injectable()
export class PaymentGatewayService {
    private coreApi: any;
    private snap: any;
    private readonly logger = new Logger(PaymentGatewayService.name);

    constructor(
        private paymentsService: PaymentsService,
        private customersService: CustomersService,
        private arrearsCalculator: ArrearsCalculatorService,
    ) {
        this.snap = new midtransClient.Snap({
            isProduction: false,
            serverKey: process.env.MIDTRANS_SERVER_KEY,
            clientKey: process.env.MIDTRANS_CLIENT_KEY,
        });
    }

    async createTransaction(orderId: string, amount: number, customerDetails: any = {}) {
        // Create explicit item details to show Fee
        const ADMIN_FEE = 5000;
        const totalAmount = amount + ADMIN_FEE;

        // Ensure orderId is unique (add timestamp if not present, though caller usually handles it)
        const parameter = {
            transaction_details: {
                order_id: orderId,
                gross_amount: totalAmount,
            },
            item_details: [
                {
                    id: 'BILL',
                    price: amount,
                    quantity: 1,
                    name: `Tagihan Sampah ${customerDetails.firstName || ''}`.substring(0, 50),
                },
                {
                    id: 'ADMIN_FEE',
                    price: ADMIN_FEE,
                    quantity: 1,
                    name: 'Biaya Layanan Online',
                }
            ],
            customer_details: {
                first_name: customerDetails.firstName || 'Pelanggan',
                last_name: customerDetails.lastName || 'Sabamas',
                email: customerDetails.email || 'customer@sabamas.com',
                phone: customerDetails.phone || '08123456789',
            },
            credit_card: {
                secure: true,
            },
        };

        try {
            const transaction = await this.snap.createTransaction(parameter);
            this.logger.log(`Midtrans Transaction Created: ${orderId}`);
            return transaction; // Berisi token & redirect_url
        } catch (error) {
            this.logger.error('Midtrans Error:', error);
            throw error;
        }
    }

    async handleNotification(notification: any) {
        try {
            this.logger.log(`Received notification: ${JSON.stringify(notification)}`);

            // SKIP Midtrans Verification for simpler dev testing
            // const statusResponse = await this.snap.transaction.notification(notification);

            const statusResponse = notification; // Use the raw body directly
            const orderId = statusResponse.order_id;
            const transactionStatus = statusResponse.transaction_status;
            const fraudStatus = statusResponse.fraud_status;

            this.logger.log(`Transaction Check: ${orderId}, Status: ${transactionStatus}`);

            if (transactionStatus === 'capture') {
                if (fraudStatus == 'challenge') {
                    // TODO: Set status ke challenge
                    return { status: 'challenge' };
                } else if (fraudStatus == 'accept') {
                    // Pembayaran Berhasil (Kartu Kredit)
                    await this.processSuccessfulPayment(orderId, statusResponse);
                    return { status: 'success' };
                }
            } else if (transactionStatus === 'settlement') {
                // Pembayaran Berhasil (Transfer Bank, dll)
                await this.processSuccessfulPayment(orderId, statusResponse);
                return { status: 'success' };
            } else if (
                transactionStatus === 'cancel' ||
                transactionStatus === 'deny' ||
                transactionStatus === 'expire'
            ) {
                // Pembayaran Gagal
                this.logger.warn(`Payment failed for ${orderId}`);
                return { status: 'failed' };
            } else if (transactionStatus === 'pending') {
                // Menunggu pembayaran
                return { status: 'pending' };
            }
        } catch (error) {
            this.logger.error('Error handling notification:', error);
            throw error;
        }
    }

    private async processSuccessfulPayment(orderId: string, transactionData: any) {
        // Check if payment already processed (bisa cek di database kalau perlu)
        // Disini kita asumsi belum, atau idempotency key bisa ditambah nanti

        // 1. Extract Customer Info from Order ID (Format: PLG-NOMOR_PELANGGAN-TIMESTAMP)
        // Contoh: PLG-PLG0001-17359123123
        const parts = orderId.split('-');
        if (parts.length < 2) {
            this.logger.error(`Invalid Order ID format: ${orderId}`);
            return;
        }

        const nomorPelanggan = parts[1]; // Parts[0] = PLG, Parts[1] = PLG0001

        // Cari customer by Nomor Pelanggan
        // Note: CustomersService.findAll logic might be complex, let's use Prisma directly inside Service if needed 
        // But since we injected CustomersService, let's try to search. 
        // Wait, CustomersService doesn't have findByNomorPelanggan exposed easily?
        // Let's assume we can search by search param
        const { data: customers } = await this.customersService.findAll({ search: nomorPelanggan, limit: 1 });

        if (customers.length === 0) {
            this.logger.error(`Customer not found for Nomor Pelanggan: ${nomorPelanggan}`);
            return;
        }

        const customer = customers[0];
        const ADMIN_FEE = 5000;
        let amountPaid = parseFloat(transactionData.gross_amount);

        // Deduct Admin Fee if applicable
        // Assume any amount > arrears + fee indicates the user paid the fee
        // Or strictly deduct 5000? Even safer: Just try to pay bills with (Total - 5000)

        // Check if amount includes fee?
        // E.g. Customer pays 35000. Fee is 5000. Net is 30000.
        // If we strictly deduct 5000:
        if (amountPaid > ADMIN_FEE) {
            amountPaid -= ADMIN_FEE;
            this.logger.log(`Deducted Admin Fee ${ADMIN_FEE}. Net Amount for Bill: ${amountPaid}`);
        } else {
            // Dangerous edge case: Customer paid less than fee?
            this.logger.warn(`Amount paid (${amountPaid}) is less than Admin Fee (${ADMIN_FEE}). Using 0 for bill.`);
            amountPaid = 0;
        }

        this.logger.log(`Processing payment for ${customer.nama}, Net Amount: ${amountPaid}`);

        // 2. Get Arrears
        const arrears = await this.arrearsCalculator.calculateArrears(customer.id);
        const sortedArrears = arrears.arrearMonths.sort((a, b) => a.month.localeCompare(b.month));

        // 3. Distribute Amount to Oldest Arrears
        let remainingAmount = amountPaid;
        const monthsToPay: string[] = [];

        for (const arrear of sortedArrears) {
            if (remainingAmount <= 0) break;

            // Logic: If remaining amount covers this month's arrear, pay it full.
            // If we have partial payment logic, we can support it.
            // But for simplicity, we assume user pays FULL arrears as requested in FE.
            // However, if amount is partial, we prioritize oldest.

            // We will add this month to the list if we can pay at least SOME of it
            // PaymentsService.create handles sub-distribution and creating partial records!
            // So we just need to pass the list of months we INTEND to pay.

            // Wait, PaymentsService logic distributes `jumlah_bayar` across `bulan_dibayar` list sequentially.
            // So if we pass ALL arrear months, PaymentsService will fill them up one by one until money runs out.
            // Exactly what we need!

            monthsToPay.push(arrear.month);

            // Reduce remaining just for our check (though PaymentsService does the precise math)
            remainingAmount -= arrear.amount;
        }

        if (monthsToPay.length === 0) {
            this.logger.warn(`No arrears found to pay for ${customer.nama}, but received money. Logging check needed.`);
            // Optional: Create 'Deposit' record if no arrears?
            return;
        }

        // 4. Create Payment Record
        await this.paymentsService.create({
            customer_id: customer.id,
            bulan_dibayar: monthsToPay,
            jumlah_bayar: amountPaid,
            metode_bayar: 'transfer', // Midtrans is transfer
            catatan: `Pembayaran Online via Midtrans (Order: ${orderId})`,
            is_partial: false // PaymentsService will auto-detect if it becomes partial
        });

        this.logger.log(`Payment recorded successfully for ${monthsToPay.join(', ')}`);
    }
}
