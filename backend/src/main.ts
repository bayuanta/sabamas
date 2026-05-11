import { NestFactory } from '@nestjs/core';
import { ValidationPipe, RequestMethod } from '@nestjs/common';
import { AppModule } from './app.module';
import { NestExpressApplication } from '@nestjs/platform-express';

let cachedApp: NestExpressApplication;

async function bootstrap() {
  if (!cachedApp) {
    const app = await NestFactory.create<NestExpressApplication>(AppModule);

    // Enable CORS for frontend
    app.enableCors({
      origin: '*',
      methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
      allowedHeaders: 'Content-Type, Accept, Authorization',
    });

    // Enable validation pipe globally
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: true,
      }),
    );

    // Set global prefix
    app.setGlobalPrefix('api', {
      exclude: [{ path: '/', method: RequestMethod.GET }],
    });

    await app.init();
    cachedApp = app;
  }
  return cachedApp;
}

// Export for Vercel Serverless Function
export default async (req: any, res: any) => {
  const app = await bootstrap();
  const instance = app.getHttpAdapter().getInstance();
  instance(req, res);
};
