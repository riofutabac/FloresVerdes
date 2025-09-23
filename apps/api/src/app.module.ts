import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { CqrsModule } from '@nestjs/cqrs';

// Modules
import { AdminModule } from './modules/admin/admin.module';
import { CosechaModule } from './modules/cosecha/cosecha.module';
import { KpiModule } from './modules/kpi/kpi.module';
import { FilesModule } from './modules/files/files.module';

// Infrastructure
import { PrismaModule } from './infra/prisma/prisma.module';
import { SupabaseModule } from './infra/supabase/supabase.module';

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    
    // Schedule for background jobs
    ScheduleModule.forRoot(),
    
    // CQRS
    CqrsModule,
    
    // Infrastructure
    PrismaModule,
    SupabaseModule,
    
    // Business modules
    AdminModule,
    CosechaModule,
    KpiModule,
    FilesModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}