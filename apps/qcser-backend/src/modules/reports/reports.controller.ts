import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  Param,
  UseGuards,
  Request,
  HttpStatus,
  HttpException,
  Res,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import type { Response } from 'express';
import { ReportsService, ReportData } from './reports.service';
import { GenerateReportDto, ReportFilterDto, KPIDto, ReportType, ReportFormat } from './dto/report.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../entities/user.entity';
import * as fs from 'fs';
import * as path from 'path';

@ApiTags('Reportes')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Post('generate')
  @ApiOperation({ summary: 'Generar un reporte' })
  @ApiResponse({ status: 201, description: 'Reporte generado exitosamente' })
  @ApiResponse({ status: 400, description: 'Parámetros inválidos' })
  @Roles(UserRole.ADMINISTRADOR, UserRole.JEFA_CALIDAD, UserRole.GERENTE_GENERAL)
  async generateReport(
    @Body() generateReportDto: GenerateReportDto,
    @Request() req: any,
  ): Promise<ReportData> {
    try {
      const userId = req.user.sub;
      return await this.reportsService.generateReport(generateReportDto, userId);
    } catch (error) {
      throw new HttpException(
        error.message || 'Error generando reporte',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('kpis')
  @ApiOperation({ summary: 'Obtener KPIs del sistema' })
  @ApiResponse({ status: 200, description: 'KPIs obtenidos exitosamente' })
  @ApiQuery({ name: 'startDate', required: true, type: String })
  @ApiQuery({ name: 'endDate', required: true, type: String })
  @ApiQuery({ name: 'areaIds', required: false, type: [Number] })
  @ApiQuery({ name: 'moduleIds', required: false, type: [Number] })
  @Roles(UserRole.ADMINISTRADOR, UserRole.JEFA_CALIDAD, UserRole.GERENTE_GENERAL)
  async getKPIs(@Query() kpiDto: KPIDto): Promise<any> {
    try {
      return await this.reportsService.getKPIs(kpiDto);
    } catch (error) {
      throw new HttpException(
        error.message || 'Error obteniendo KPIs',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('download/:fileName')
  @ApiOperation({ summary: 'Descargar un reporte generado' })
  @ApiResponse({ status: 200, description: 'Archivo descargado exitosamente' })
  @ApiResponse({ status: 404, description: 'Archivo no encontrado' })
  @Roles(UserRole.ADMINISTRADOR, UserRole.JEFA_CALIDAD, UserRole.GERENTE_GENERAL)
  async downloadReport(
    @Param('fileName') fileName: string,
    @Res() res: Response,
  ): Promise<void> {
    try {
      const filePath = path.join(process.cwd(), 'storage', 'reports', fileName);
      
      if (!fs.existsSync(filePath)) {
        throw new HttpException('Archivo no encontrado', HttpStatus.NOT_FOUND);
      }

      // Determinar tipo de contenido basado en la extensión
      const ext = path.extname(fileName).toLowerCase();
      let contentType = 'application/octet-stream';
      
      switch (ext) {
        case '.json':
          contentType = 'application/json';
          break;
        case '.csv':
          contentType = 'text/csv';
          break;
        case '.pdf':
          contentType = 'application/pdf';
          break;
        case '.xlsx':
          contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
          break;
      }

      res.setHeader('Content-Type', contentType);
      res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
      
      const fileStream = fs.createReadStream(filePath);
      fileStream.pipe(res);
    } catch (error) {
      throw new HttpException(
        error.message || 'Error descargando archivo',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('templates')
  @ApiOperation({ summary: 'Obtener plantillas de reportes disponibles' })
  @ApiResponse({ status: 200, description: 'Plantillas obtenidas exitosamente' })
  @Roles(UserRole.ADMINISTRADOR, UserRole.JEFA_CALIDAD, UserRole.GERENTE_GENERAL)
  async getReportTemplates(): Promise<{
    types: { value: ReportType; label: string; description: string }[];
    formats: { value: ReportFormat; label: string; description: string }[];
  }> {
    return {
      types: [
        {
          value: ReportType.EVALUATIONS_SUMMARY,
          label: 'Resumen de Evaluaciones',
          description: 'Resumen general de todas las evaluaciones en un período',
        },
        {
          value: ReportType.OPERATOR_PERFORMANCE,
          label: 'Rendimiento de Operarios',
          description: 'Análisis detallado del rendimiento individual de operarios',
        },
        {
          value: ReportType.COMPLIANCE_TRENDS,
          label: 'Tendencias de Cumplimiento',
          description: 'Análisis de tendencias de cumplimiento a lo largo del tiempo',
        },
        {
          value: ReportType.AREA_COMPARISON,
          label: 'Comparación de Áreas',
          description: 'Comparación de rendimiento entre diferentes áreas',
        },
        {
          value: ReportType.MODULE_COMPARISON,
          label: 'Comparación de Módulos',
          description: 'Comparación de rendimiento entre diferentes módulos',
        },
        {
          value: ReportType.WEEKLY_REPORT,
          label: 'Reporte Semanal',
          description: 'Reporte consolidado semanal',
        },
        {
          value: ReportType.MONTHLY_REPORT,
          label: 'Reporte Mensual',
          description: 'Reporte consolidado mensual',
        },
      ],
      formats: [
        {
          value: ReportFormat.JSON,
          label: 'JSON',
          description: 'Formato de datos estructurados JSON',
        },
        {
          value: ReportFormat.CSV,
          label: 'CSV',
          description: 'Archivo de valores separados por comas',
        },
        {
          value: ReportFormat.PDF,
          label: 'PDF',
          description: 'Documento PDF (próximamente)',
        },
        {
          value: ReportFormat.EXCEL,
          label: 'Excel',
          description: 'Hoja de cálculo Excel (próximamente)',
        },
      ],
    };
  }

  @Get('dashboard-data')
  @ApiOperation({ summary: 'Obtener datos para dashboard' })
  @ApiResponse({ status: 200, description: 'Datos del dashboard obtenidos exitosamente' })
  @ApiQuery({ name: 'startDate', required: false, type: String })
  @ApiQuery({ name: 'endDate', required: false, type: String })
  @ApiQuery({ name: 'areaIds', required: false, type: [Number] })
  @ApiQuery({ name: 'moduleIds', required: false, type: [Number] })
  @Roles(UserRole.ADMINISTRADOR, UserRole.JEFA_CALIDAD, UserRole.GERENTE_GENERAL)
  async getDashboardData(@Query() filters: {
    startDate?: string;
    endDate?: string;
    areaIds?: number[];
    moduleIds?: number[];
  }): Promise<any> {
    try {
      // Si no se proporcionan fechas, usar los últimos 30 días
      const endDate = filters.endDate || new Date().toISOString().split('T')[0];
      const startDate = filters.startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

      const kpis = await this.reportsService.getKPIs({
        startDate,
        endDate,
        areaIds: filters.areaIds,
        moduleIds: filters.moduleIds,
      });

      // Generar datos adicionales para gráficos
      const complianceTrends = await this.reportsService.generateReport({
        type: ReportType.COMPLIANCE_TRENDS,
        format: ReportFormat.JSON,
        startDate,
        endDate,
        areaIds: filters.areaIds,
        moduleIds: filters.moduleIds,
      }, 'system');

      const areaComparison = await this.reportsService.generateReport({
        type: ReportType.AREA_COMPARISON,
        format: ReportFormat.JSON,
        startDate,
        endDate,
        areaIds: filters.areaIds,
      }, 'system');

      return {
        kpis: kpis.kpis,
        period: kpis.period,
        trends: complianceTrends.data.trends,
        areaComparison: areaComparison.data.areas,
      };
    } catch (error) {
      throw new HttpException(
        error.message || 'Error obteniendo datos del dashboard',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('operators')
  @ApiOperation({ summary: 'Obtener lista de operarios para reportes individuales' })
  @ApiResponse({ status: 200, description: 'Lista de operarios obtenida exitosamente' })
  @ApiQuery({ name: 'areaId', required: false, type: Number })
  @ApiQuery({ name: 'moduleId', required: false, type: Number })
  @ApiQuery({ name: 'status', required: false, type: String })
  @ApiQuery({ name: 'search', required: false, type: String })
  @Roles(UserRole.ADMINISTRADOR, UserRole.JEFA_CALIDAD, UserRole.GERENTE_GENERAL)
  async getOperatorsForReports(@Query() filters: {
    areaId?: number;
    moduleId?: number;
    status?: string;
    search?: string;
  }): Promise<any[]> {
    try {
      return await this.reportsService.getOperatorsForReports(filters);
    } catch (error) {
      throw new HttpException(
        error.message || 'Error obteniendo lista de operarios',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('operators/:operatorId/individual')
  @ApiOperation({ summary: 'Generar reporte individual de operario' })
  @ApiResponse({ status: 200, description: 'Reporte individual generado exitosamente' })
  @ApiResponse({ status: 404, description: 'Operario no encontrado' })
  @ApiQuery({ name: 'startDate', required: true, type: String })
  @ApiQuery({ name: 'endDate', required: true, type: String })
  @Roles(UserRole.ADMINISTRADOR, UserRole.JEFA_CALIDAD, UserRole.GERENTE_GENERAL)
  async generateIndividualOperatorReport(
    @Param('operatorId') operatorId: number,
    @Query() params: { startDate: string; endDate: string },
  ): Promise<any> {
    try {
      const generateReportDto: GenerateReportDto = {
        type: ReportType.OPERATOR_PERFORMANCE,
        format: ReportFormat.JSON,
        startDate: params.startDate,
        endDate: params.endDate,
        operatorIds: [operatorId],
      };

      return await this.reportsService.generateIndividualOperatorReport(operatorId, generateReportDto);
    } catch (error) {
      throw new HttpException(
        error.message || 'Error generando reporte individual',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('evaluations/history')
  @ApiOperation({ summary: 'Obtener historial de evaluaciones con filtros' })
  @ApiResponse({ status: 200, description: 'Historial de evaluaciones obtenido exitosamente' })
  @ApiQuery({ name: 'operatorId', required: false, type: Number })
  @ApiQuery({ name: 'quadrantCode', required: false, type: String })
  @ApiQuery({ name: 'areaId', required: false, type: Number })
  @ApiQuery({ name: 'moduleId', required: false, type: Number })
  @ApiQuery({ name: 'startDate', required: false, type: String })
  @ApiQuery({ name: 'endDate', required: false, type: String })
  @ApiQuery({ name: 'minCompliance', required: false, type: Number })
  @ApiQuery({ name: 'maxCompliance', required: false, type: Number })
  @ApiQuery({ name: 'status', required: false, type: String })
  @Roles(UserRole.ADMINISTRADOR, UserRole.JEFA_CALIDAD, UserRole.GERENTE_GENERAL)
  async getEvaluationHistory(@Query() filters: {
    operatorId?: number;
    quadrantCode?: string;
    areaId?: number;
    moduleId?: number;
    startDate?: string;
    endDate?: string;
    minCompliance?: number;
    maxCompliance?: number;
    status?: string;
  }): Promise<any> {
    try {
      return await this.reportsService.getEvaluationHistory(filters);
    } catch (error) {
      throw new HttpException(
        error.message || 'Error obteniendo historial de evaluaciones',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('external-dashboard')
  @ApiOperation({ summary: 'Obtener datos optimizados para dashboard externo' })
  @ApiResponse({ status: 200, description: 'Datos del dashboard externo obtenidos exitosamente' })
  @ApiQuery({ name: 'startDate', required: true, type: String })
  @ApiQuery({ name: 'endDate', required: true, type: String })
  @ApiQuery({ name: 'areaIds', required: false, type: [Number] })
  @ApiQuery({ name: 'moduleIds', required: false, type: [Number] })
  @Roles(UserRole.ADMINISTRADOR, UserRole.JEFA_CALIDAD, UserRole.GERENTE_GENERAL)
  async getExternalDashboardData(@Query() filters: {
    startDate: string;
    endDate: string;
    areaIds?: number[];
    moduleIds?: number[];
  }): Promise<any> {
    try {
      return await this.reportsService.getExternalDashboardData(filters);
    } catch (error) {
      throw new HttpException(
        error.message || 'Error obteniendo datos del dashboard externo',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('export/:reportId')
  @ApiOperation({ summary: 'Exportar reporte existente a diferentes formatos' })
  @ApiResponse({ status: 200, description: 'Reporte exportado exitosamente' })
  @ApiResponse({ status: 404, description: 'Reporte no encontrado' })
  @Roles(UserRole.ADMINISTRADOR, UserRole.JEFA_CALIDAD, UserRole.GERENTE_GENERAL)
  async exportReport(
    @Param('reportId') reportId: string,
    @Body() exportDto: { format: ReportFormat },
  ): Promise<{ fileName: string; downloadUrl: string }> {
    try {
      // En una implementación real, buscaríamos el reporte por ID en base de datos
      // Por ahora, simulamos con datos de ejemplo
      const mockReportData: any = {
        id: reportId,
        fileName: `report_${reportId}`,
        data: {
          summary: {
            totalEvaluations: 100,
            averageCompliance: 85.5,
            period: { startDate: '2024-01-01', endDate: '2024-01-31' },
          },
          evaluations: [],
        },
      };

      const fileName = await this.reportsService.exportReport(mockReportData, exportDto.format);
      
      return {
        fileName,
        downloadUrl: `/reports/download/${fileName}`,
      };
    } catch (error) {
      throw new HttpException(
        error.message || 'Error exportando reporte',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('analytics/comparative-charts')
  @ApiOperation({ summary: 'Obtener gráficos comparativos para analytics' })
  @ApiResponse({ status: 200, description: 'Gráficos comparativos obtenidos exitosamente' })
  @ApiQuery({ name: 'startDate', required: true, type: String })
  @ApiQuery({ name: 'endDate', required: true, type: String })
  @ApiQuery({ name: 'areaIds', required: false, type: [Number] })
  @Roles(UserRole.ADMINISTRADOR, UserRole.JEFA_CALIDAD, UserRole.GERENTE_GENERAL)
  async getComparativeCharts(@Query() filters: {
    startDate: string;
    endDate: string;
    areaIds?: number[];
  }): Promise<any> {
    try {
      const dashboardData = await this.reportsService.getExternalDashboardData(filters);
      
      return {
        areaComparison: dashboardData.charts.areaComparison,
        operatorRankings: dashboardData.charts.operatorRankings,
        paretoAnalysis: dashboardData.charts.paretoAnalysis,
        globalTrend: dashboardData.charts.globalTrend,
      };
    } catch (error) {
      throw new HttpException(
        error.message || 'Error obteniendo gráficos comparativos',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('analytics/heatmaps')
  @ApiOperation({ summary: 'Obtener datos para heatmaps' })
  @ApiResponse({ status: 200, description: 'Datos de heatmaps obtenidos exitosamente' })
  @ApiQuery({ name: 'startDate', required: true, type: String })
  @ApiQuery({ name: 'endDate', required: true, type: String })
  @ApiQuery({ name: 'areaIds', required: false, type: [Number] })
  @Roles(UserRole.ADMINISTRADOR, UserRole.JEFA_CALIDAD, UserRole.GERENTE_GENERAL)
  async getHeatmapData(@Query() filters: {
    startDate: string;
    endDate: string;
    areaIds?: number[];
  }): Promise<any> {
    try {
      const dashboardData = await this.reportsService.getExternalDashboardData(filters);
      
      return {
        areaWeekHeatmap: dashboardData.charts.heatmap,
        stackedBars: dashboardData.charts.stackedBars,
      };
    } catch (error) {
      throw new HttpException(
        error.message || 'Error obteniendo datos de heatmaps',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('analytics/distributions')
  @ApiOperation({ summary: 'Obtener datos de distribuciones y análisis estadístico' })
  @ApiResponse({ status: 200, description: 'Datos de distribuciones obtenidos exitosamente' })
  @ApiQuery({ name: 'startDate', required: true, type: String })
  @ApiQuery({ name: 'endDate', required: true, type: String })
  @ApiQuery({ name: 'operatorIds', required: false, type: [Number] })
  @Roles(UserRole.ADMINISTRADOR, UserRole.JEFA_CALIDAD, UserRole.GERENTE_GENERAL)
  async getDistributionData(@Query() filters: {
    startDate: string;
    endDate: string;
    operatorIds?: number[];
  }): Promise<any> {
    try {
      const dashboardData = await this.reportsService.getExternalDashboardData(filters);
      
      return {
        radarCharts: dashboardData.charts.radarCharts,
        boxplots: dashboardData.charts.boxplots,
      };
    } catch (error) {
      throw new HttpException(
        error.message || 'Error obteniendo datos de distribuciones',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }}
