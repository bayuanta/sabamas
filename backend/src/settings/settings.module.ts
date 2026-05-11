import { Module } from '@nestjs/common';
import { SettingsController } from './settings.controller';
import { SettingsService } from './settings.service';
import { PrismaService } from '../prisma.service';
import { SupabaseService } from '../common/supabase.service';

@Module({
    controllers: [SettingsController],
    providers: [SettingsService, PrismaService, SupabaseService],
    exports: [SettingsService],
})
export class SettingsModule { }
