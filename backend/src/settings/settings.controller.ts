import { Controller, Get, Put, Body, UseGuards, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { SettingsService } from './settings.service';
import { SupabaseService } from '../common/supabase.service';
import { memoryStorage } from 'multer';

@Controller('settings')
export class SettingsController {
  constructor(
    private readonly settingsService: SettingsService,
    private readonly supabaseService: SupabaseService
  ) { }

  @Get()
  async getSettings() {
    return this.settingsService.getSettings();
  }

  @Put()
  @UseGuards(JwtAuthGuard)
  async updateSettings(@Body() updateData: any) {
    return this.settingsService.updateSettings(updateData);
  }

  @Put('logo')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(
    FileInterceptor('logo', {
      storage: memoryStorage(),
      fileFilter: (req, file, cb) => {
        if (!file.mimetype.match(/\/(jpg|jpeg|png|gif|svg\+xml)$/)) {
          return cb(new Error('Only image files are allowed!'), false);
        }
        cb(null, true);
      },
      limits: {
        fileSize: 2 * 1024 * 1024, // 2MB
      },
    }),
  )
  async uploadLogo(@UploadedFile() file: any) {
    if (!file) {
      throw new Error('No file uploaded');
    }

    // Upload to Supabase Storage instead of local disk
    const logoUrl = await this.supabaseService.uploadFile(file, 'sabamas-uploads', 'logo');

    // Update settings in database with the new URL
    await this.settingsService.updateSettings({ logo: logoUrl });

    return {
      message: 'Logo uploaded successfully to Cloud Storage',
      logo: logoUrl,
    };
  }
}
