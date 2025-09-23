import { Controller, Post, Get, Param } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { FilesService } from './files.service';

@ApiTags('Files')
@Controller('files')
export class FilesController {
  constructor(private readonly filesService: FilesService) {}

  @Post('upload-url')
  @ApiOperation({ summary: 'Generar URL presignada para upload' })
  async generateUploadUrl() {
    return this.filesService.generateUploadUrl();
  }

  @Get(':fileId')
  @ApiOperation({ summary: 'Obtener información del archivo' })
  async getFileInfo(@Param('fileId') fileId: string) {
    return this.filesService.getFileInfo(fileId);
  }
}