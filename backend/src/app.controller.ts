import { Controller, Get } from '@nestjs/common';

@Controller()
export class AppController {
    @Get()
    getHello(): object {
        return {
            message: 'SABAMAS API is running',
            version: '1.0.0',
            timestamp: new Date().toISOString(),
        };
    }
}
