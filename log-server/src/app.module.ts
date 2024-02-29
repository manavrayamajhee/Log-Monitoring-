import { Module } from '@nestjs/common';
import { AppController } from './MonitorLogs/app.controller';
import { AppService } from './MonitorLogs/app.service';
import { LogGateway } from './MonitorLogs/log.gateway';

@Module({
  imports: [],
  controllers: [AppController],
  providers: [{ provide: LogGateway, useClass: LogGateway }, AppService],
})
export class AppModule {}
