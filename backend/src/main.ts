// Importar o polyfill do crypto primeiro
import './crypto-polyfill';

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  // Habilitar CORS para o frontend
  app.enableCors();
  await app.listen(3000);
}
bootstrap();
