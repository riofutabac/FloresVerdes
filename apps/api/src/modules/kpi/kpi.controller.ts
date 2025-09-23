import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { KpiService } from './kpi.service';

@ApiTags('KPI')
@Controller('kpi')
export class KpiController {
  constructor(private readonly kpiService: KpiService) {}

  @Get('reportes')
  @ApiOperation({ summary: 'Obtener reportes KPI' })
  async getReportes(@Query('periodo') periodo?: string) {
    return this.kpiService.getReportes(periodo);
  }

  @Get('metricas')
  @ApiOperation({ summary: 'Obtener métricas detalladas' })
  async getMetricas() {
    return this.kpiService.getMetricas();
  }
}