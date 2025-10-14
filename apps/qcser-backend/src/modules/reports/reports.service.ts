import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, In } from 'typeorm';
import { Evaluation } from '../../entities/evaluation.entity';
import { Operator, OperatorStatus } from '../../entities/operator.entity';
import { Area } from '../../entities/area.entity';
import { Module } from '../../entities/module.entity';
import { GenerateReportDto, ReportType, ReportFormat, ReportFilterDto, KPIDto } from './dto/report.dto';
import * as fs from 'fs';
import * as path from 'path';

export interface ReportData {
  id: string;
  type: ReportType;
  format: ReportFormat;
  fileName: string;
  filePath: string;
  generatedAt: Date;
  generatedBy: string;
  parameters: any;
  data: any;
}

export interface Finding {
  type: 'critical' | 'warning' | 'info';
  title: string;
  description: string;
  impact: string;
}

export interface Recommendation {
  priority: 'Alta' | 'Media' | 'Baja';
  category: string;
  title: string;
  description: string;
  expectedImpact: string;
}

@Injectable()
export class ReportsService {
  private reportsDir = path.join(process.cwd(), 'storage', 'reports');

  constructor(
    @InjectRepository(Evaluation)
    private evaluationRepository: Repository<Evaluation>,
    @InjectRepository(Operator)
    private operatorRepository: Repository<Operator>,
    @InjectRepository(Area)
    private areaRepository: Repository<Area>,
    @InjectRepository(Module)
    private moduleRepository: Repository<Module>,
  ) {
    // Crear directorio de reportes si no existe
    if (!fs.existsSync(this.reportsDir)) {
      fs.mkdirSync(this.reportsDir, { recursive: true });
    }
  }

  /**
   * Generar un reporte
   */
  async generateReport(generateReportDto: GenerateReportDto, userId: string): Promise<ReportData> {
    const reportId = `report_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    let data: any;
    let fileName: string;

    switch (generateReportDto.type) {
      case ReportType.EVALUATIONS_SUMMARY:
        data = await this.generateEvaluationsSummary(generateReportDto);
        fileName = `evaluaciones_resumen_${this.formatDateForFile(generateReportDto.startDate)}_${this.formatDateForFile(generateReportDto.endDate)}`;
        break;
      
      case ReportType.OPERATOR_PERFORMANCE:
        data = await this.generateOperatorPerformance(generateReportDto);
        fileName = `rendimiento_operarios_${this.formatDateForFile(generateReportDto.startDate)}_${this.formatDateForFile(generateReportDto.endDate)}`;
        break;
      
      case ReportType.COMPLIANCE_TRENDS:
        data = await this.generateComplianceTrends(generateReportDto);
        fileName = `tendencias_cumplimiento_${this.formatDateForFile(generateReportDto.startDate)}_${this.formatDateForFile(generateReportDto.endDate)}`;
        break;
      
      case ReportType.AREA_COMPARISON:
        data = await this.generateAreaComparison(generateReportDto);
        fileName = `comparacion_areas_${this.formatDateForFile(generateReportDto.startDate)}_${this.formatDateForFile(generateReportDto.endDate)}`;
        break;
      
      case ReportType.MODULE_COMPARISON:
        data = await this.generateModuleComparison(generateReportDto);
        fileName = `comparacion_modulos_${this.formatDateForFile(generateReportDto.startDate)}_${this.formatDateForFile(generateReportDto.endDate)}`;
        break;
      
      case ReportType.WEEKLY_REPORT:
        data = await this.generateWeeklyReport(generateReportDto);
        fileName = `reporte_semanal_${this.formatDateForFile(generateReportDto.startDate)}`;
        break;
      
      case ReportType.MONTHLY_REPORT:
        data = await this.generateMonthlyReport(generateReportDto);
        fileName = `reporte_mensual_${this.formatDateForFile(generateReportDto.startDate)}`;
        break;
      
      default:
        throw new BadRequestException('Tipo de reporte no soportado');
    }

    // Agregar extensión según formato
    const fileExtension = this.getFileExtension(generateReportDto.format);
    const fullFileName = `${fileName}.${fileExtension}`;
    const filePath = path.join(this.reportsDir, fullFileName);

    // Generar archivo según formato
    await this.generateFile(data, generateReportDto.format, filePath);

    const reportData: ReportData = {
      id: reportId,
      type: generateReportDto.type,
      format: generateReportDto.format,
      fileName: fullFileName,
      filePath,
      generatedAt: new Date(),
      generatedBy: userId,
      parameters: generateReportDto,
      data,
    };

    return reportData;
  }

  /**
   * Generar resumen de evaluaciones
   */
  private async generateEvaluationsSummary(params: GenerateReportDto): Promise<any> {
    const queryBuilder = this.evaluationRepository.createQueryBuilder('evaluation')
      .leftJoinAndSelect('evaluation.operator', 'operator')
      .leftJoinAndSelect('evaluation.area', 'area')
      .leftJoinAndSelect('evaluation.module', 'module')
      .leftJoinAndSelect('evaluation.details', 'details')
      .leftJoinAndSelect('details.parameter', 'parameter')
      .where('evaluation.evaluationDate BETWEEN :startDate AND :endDate', {
        startDate: params.startDate,
        endDate: params.endDate,
      });

    if (params.areaIds?.length) {
      queryBuilder.andWhere('evaluation.areaId IN (:...areaIds)', { areaIds: params.areaIds });
    }

    if (params.moduleIds?.length) {
      queryBuilder.andWhere('evaluation.moduleId IN (:...moduleIds)', { moduleIds: params.moduleIds });
    }

    if (params.operatorIds?.length) {
      queryBuilder.andWhere('evaluation.operatorId IN (:...operatorIds)', { operatorIds: params.operatorIds });
    }

    if (params.minCompliance !== undefined) {
      queryBuilder.andWhere('evaluation.compliancePercentage >= :minCompliance', { minCompliance: params.minCompliance });
    }

    if (params.maxCompliance !== undefined) {
      queryBuilder.andWhere('evaluation.compliancePercentage <= :maxCompliance', { maxCompliance: params.maxCompliance });
    }

    const evaluations = await queryBuilder.getMany();

    // Calcular estadísticas
    const totalEvaluations = evaluations.length;
    const averageCompliance = evaluations.reduce((sum, evaluation) => sum + evaluation.compliancePercentage, 0) / totalEvaluations;
    
    const complianceRanges = {
      excellent: evaluations.filter(e => e.compliancePercentage >= 90).length,
      good: evaluations.filter(e => e.compliancePercentage >= 80 && e.compliancePercentage < 90).length,
      regular: evaluations.filter(e => e.compliancePercentage >= 70 && e.compliancePercentage < 80).length,
      poor: evaluations.filter(e => e.compliancePercentage < 70).length,
    };

    return {
      summary: {
        totalEvaluations,
        averageCompliance: Math.round(averageCompliance * 100) / 100,
        complianceRanges,
        period: {
          startDate: params.startDate,
          endDate: params.endDate,
        },
      },
      evaluations: evaluations.map(evaluation => ({
        id: evaluation.id,
        operator: {
          id: evaluation.operator.id,
          employeeId: evaluation.operator.employeeId,
          fullName: evaluation.operator.fullName,
        },
        area: evaluation.area.name,
        module: evaluation.module.name,
        quadrant: evaluation.quadrantCode,
        evaluationDate: evaluation.evaluationDate,
        evaluationTime: evaluation.evaluationTime,
        compliancePercentage: evaluation.compliancePercentage,
        finalScore: evaluation.finalScore,
        status: evaluation.status,
        generalObservations: evaluation.generalObservations,
        details: params.includeParameterDetails ? evaluation.details.map(detail => ({
          parameter: detail.parameter.name,
          isCompliant: detail.isCompliant,
          weightApplied: detail.weightApplied,
          observations: detail.observations,
        })) : undefined,
      })),
    };
  } 
 /**
   * Generar reporte de rendimiento de operarios
   */
  private async generateOperatorPerformance(params: GenerateReportDto): Promise<any> {
    const operators = await this.operatorRepository.find({
      where: params.operatorIds?.length ? { id: In(params.operatorIds) } : {},
      relations: ['area', 'module', 'evaluations'],
    });

    const operatorStats = await Promise.all(
      operators.map(async (operator) => {
        const evaluations = await this.evaluationRepository.find({
          where: {
            operatorId: operator.id,
            evaluationDate: Between(new Date(params.startDate), new Date(params.endDate)),
          },
          order: { evaluationDate: 'ASC' },
        });

        const totalEvaluations = evaluations.length;
        const averageCompliance = totalEvaluations > 0 
          ? evaluations.reduce((sum, evaluation) => sum + evaluation.compliancePercentage, 0) / totalEvaluations
          : 0;

        const trend = this.calculateTrend(evaluations.map(e => e.compliancePercentage));

        return {
          operator: {
            id: operator.id,
            employeeId: operator.employeeId,
            fullName: operator.fullName,
            area: operator.area.name,
            module: operator.module.name,
            quadrant: operator.quadrantCode,
          },
          statistics: {
            totalEvaluations,
            averageCompliance: Math.round(averageCompliance * 100) / 100,
            bestScore: totalEvaluations > 0 ? Math.max(...evaluations.map(e => e.compliancePercentage)) : 0,
            worstScore: totalEvaluations > 0 ? Math.min(...evaluations.map(e => e.compliancePercentage)) : 0,
            trend,
          },
          evaluations: evaluations.map(evaluation => ({
            date: evaluation.evaluationDate,
            time: evaluation.evaluationTime,
            compliance: evaluation.compliancePercentage,
            score: evaluation.finalScore,
          })),
        };
      })
    );

    return {
      summary: {
        totalOperators: operators.length,
        period: {
          startDate: params.startDate,
          endDate: params.endDate,
        },
      },
      operators: operatorStats.sort((a, b) => b.statistics.averageCompliance - a.statistics.averageCompliance),
    };
  }

  /**
   * Generar tendencias de cumplimiento
   */
  private async generateComplianceTrends(params: GenerateReportDto): Promise<any> {
    const evaluations = await this.evaluationRepository.find({
      where: {
        evaluationDate: Between(new Date(params.startDate), new Date(params.endDate)),
        ...(params.areaIds?.length && { areaId: In(params.areaIds) }),
        ...(params.moduleIds?.length && { moduleId: In(params.moduleIds) }),
      },
      order: { evaluationDate: 'ASC' },
    });

    // Agrupar por fecha
    const dailyStats = evaluations.reduce((acc, evaluation) => {
      const dateKey = evaluation.evaluationDate.toString();
      if (!acc[dateKey]) {
        acc[dateKey] = {
          date: evaluation.evaluationDate,
          evaluations: [],
          totalEvaluations: 0,
          averageCompliance: 0,
        };
      }
      acc[dateKey].evaluations.push(evaluation.compliancePercentage);
      acc[dateKey].totalEvaluations++;
      return acc;
    }, {} as Record<string, any>);

    // Calcular promedios diarios
    const dailyTrends = Object.values(dailyStats).map((day: any) => {
      day.averageCompliance = day.evaluations.reduce((sum: number, comp: number) => sum + comp, 0) / day.totalEvaluations;
      day.averageCompliance = Math.round(day.averageCompliance * 100) / 100;
      delete day.evaluations; // No necesitamos los datos individuales en el resultado
      return day;
    });

    return {
      summary: {
        totalEvaluations: evaluations.length,
        overallAverage: Math.round((evaluations.reduce((sum, evaluation) => sum + evaluation.compliancePercentage, 0) / evaluations.length) * 100) / 100,
        period: {
          startDate: params.startDate,
          endDate: params.endDate,
        },
      },
      trends: dailyTrends,
    };
  }

  /**
   * Generar comparación de áreas
   */
  private async generateAreaComparison(params: GenerateReportDto): Promise<any> {
    const areas = await this.areaRepository.find({
      where: params.areaIds?.length ? { id: In(params.areaIds) } : {},
    });

    const areaStats = await Promise.all(
      areas.map(async (area) => {
        const evaluations = await this.evaluationRepository.find({
          where: {
            areaId: area.id,
            evaluationDate: Between(new Date(params.startDate), new Date(params.endDate)),
          },
        });

        const totalEvaluations = evaluations.length;
        const averageCompliance = totalEvaluations > 0 
          ? evaluations.reduce((sum, evaluation) => sum + evaluation.compliancePercentage, 0) / totalEvaluations
          : 0;

        return {
          area: {
            id: area.id,
            name: area.name,
            description: area.description,
          },
          statistics: {
            totalEvaluations,
            averageCompliance: Math.round(averageCompliance * 100) / 100,
            bestScore: totalEvaluations > 0 ? Math.max(...evaluations.map(e => e.compliancePercentage)) : 0,
            worstScore: totalEvaluations > 0 ? Math.min(...evaluations.map(e => e.compliancePercentage)) : 0,
          },
        };
      })
    );

    return {
      summary: {
        totalAreas: areas.length,
        period: {
          startDate: params.startDate,
          endDate: params.endDate,
        },
      },
      areas: areaStats.sort((a, b) => b.statistics.averageCompliance - a.statistics.averageCompliance),
    };
  }

  /**
   * Generar comparación de módulos
   */
  private async generateModuleComparison(params: GenerateReportDto): Promise<any> {
    const modules = await this.moduleRepository.find({
      where: params.moduleIds?.length ? { id: In(params.moduleIds) } : {},
    });

    const moduleStats = await Promise.all(
      modules.map(async (module) => {
        const evaluations = await this.evaluationRepository.find({
          where: {
            moduleId: module.id,
            evaluationDate: Between(new Date(params.startDate), new Date(params.endDate)),
          },
        });

        const totalEvaluations = evaluations.length;
        const averageCompliance = totalEvaluations > 0 
          ? evaluations.reduce((sum, evaluation) => sum + evaluation.compliancePercentage, 0) / totalEvaluations
          : 0;

        return {
          module: {
            id: module.id,
            name: module.name,
            description: module.description,
          },
          statistics: {
            totalEvaluations,
            averageCompliance: Math.round(averageCompliance * 100) / 100,
            bestScore: totalEvaluations > 0 ? Math.max(...evaluations.map(e => e.compliancePercentage)) : 0,
            worstScore: totalEvaluations > 0 ? Math.min(...evaluations.map(e => e.compliancePercentage)) : 0,
          },
        };
      })
    );

    return {
      summary: {
        totalModules: modules.length,
        period: {
          startDate: params.startDate,
          endDate: params.endDate,
        },
      },
      modules: moduleStats.sort((a, b) => b.statistics.averageCompliance - a.statistics.averageCompliance),
    };
  }

  /**
   * Generar reporte semanal
   */
  private async generateWeeklyReport(params: GenerateReportDto): Promise<any> {
    // Implementar lógica específica para reporte semanal
    return await this.generateEvaluationsSummary(params);
  }

  /**
   * Generar reporte mensual
   */
  private async generateMonthlyReport(params: GenerateReportDto): Promise<any> {
    // Implementar lógica específica para reporte mensual
    return await this.generateEvaluationsSummary(params);
  }

  /**
   * Obtener KPIs del sistema
   */
  async getKPIs(kpiDto: KPIDto): Promise<any> {
    const evaluations = await this.evaluationRepository.find({
      where: {
        evaluationDate: Between(new Date(kpiDto.startDate), new Date(kpiDto.endDate)),
        ...(kpiDto.areaIds?.length && { areaId: In(kpiDto.areaIds) }),
        ...(kpiDto.moduleIds?.length && { moduleId: In(kpiDto.moduleIds) }),
      },
      relations: ['operator', 'area', 'module'],
    });

    const totalEvaluations = evaluations.length;
    const averageCompliance = totalEvaluations > 0 
      ? evaluations.reduce((sum, evaluation) => sum + evaluation.compliancePercentage, 0) / totalEvaluations
      : 0;

    const uniqueOperators = new Set(evaluations.map(e => e.operatorId)).size;
    const evaluationsPerOperator = totalEvaluations / uniqueOperators || 0;

    const complianceDistribution = {
      excellent: evaluations.filter(e => e.compliancePercentage >= 90).length,
      good: evaluations.filter(e => e.compliancePercentage >= 80 && e.compliancePercentage < 90).length,
      regular: evaluations.filter(e => e.compliancePercentage >= 70 && e.compliancePercentage < 80).length,
      poor: evaluations.filter(e => e.compliancePercentage < 70).length,
    };

    return {
      period: {
        startDate: kpiDto.startDate,
        endDate: kpiDto.endDate,
      },
      kpis: {
        totalEvaluations,
        averageCompliance: Math.round(averageCompliance * 100) / 100,
        uniqueOperators,
        evaluationsPerOperator: Math.round(evaluationsPerOperator * 100) / 100,
        complianceDistribution,
        complianceRate: Math.round((complianceDistribution.excellent + complianceDistribution.good) / totalEvaluations * 100 * 100) / 100,
      },
    };
  }

  /**
   * Generar promedio de cosecha con gráfico de líneas (KPI-02)
   */
  async generateHarvestAverageChart(params: GenerateReportDto): Promise<any> {
    const evaluations = await this.evaluationRepository.find({
      where: {
        evaluationDate: Between(new Date(params.startDate), new Date(params.endDate)),
        ...(params.areaIds?.length && { areaId: In(params.areaIds) }),
        ...(params.moduleIds?.length && { moduleId: In(params.moduleIds) }),
      },
      relations: ['area', 'module'],
      order: { evaluationDate: 'ASC' },
    });

    // Agrupar por fecha para calcular promedios diarios/semanales
    const dailyStats = evaluations.reduce((acc, evaluation) => {
      const dateKey = evaluation.evaluationDate.toISOString().split('T')[0];
      if (!acc[dateKey]) {
        acc[dateKey] = {
          date: dateKey,
          evaluations: [],
          totalEvaluations: 0,
          averageCompliance: 0,
        };
      }
      acc[dateKey].evaluations.push(evaluation.compliancePercentage);
      acc[dateKey].totalEvaluations++;
      return acc;
    }, {} as Record<string, any>);

    // Calcular promedios y tendencias
    const chartData = Object.values(dailyStats).map((day: any) => {
      day.averageCompliance = day.evaluations.reduce((sum: number, comp: number) => sum + comp, 0) / day.totalEvaluations;
      day.averageCompliance = Math.round(day.averageCompliance * 100) / 100;
      delete day.evaluations;
      return day;
    });

    const trend = this.calculateTrend(chartData.map(d => d.averageCompliance));

    return {
      chartData,
      trend,
      summary: {
        totalDays: chartData.length,
        overallAverage: Math.round((chartData.reduce((sum, day) => sum + day.averageCompliance, 0) / chartData.length) * 100) / 100,
        bestDay: chartData.reduce((best, day) => day.averageCompliance > best.averageCompliance ? day : best, chartData[0]),
        worstDay: chartData.reduce((worst, day) => day.averageCompliance < worst.averageCompliance ? day : worst, chartData[0]),
      },
    };
  }

  /**
   * Generar promedio por área con gráfico de líneas (KPI-03)
   */
  async generateAreaAverageChart(params: GenerateReportDto): Promise<any> {
    const evaluations = await this.evaluationRepository.find({
      where: {
        evaluationDate: Between(new Date(params.startDate), new Date(params.endDate)),
        ...(params.areaIds?.length && { areaId: In(params.areaIds) }),
        ...(params.moduleIds?.length && { moduleId: In(params.moduleIds) }),
      },
      relations: ['area'],
      order: { evaluationDate: 'ASC' },
    });

    // Agrupar por área y fecha
    const areaDateStats = evaluations.reduce((acc, evaluation) => {
      const areaKey = evaluation.area.name;
      const dateKey = evaluation.evaluationDate.toISOString().split('T')[0];
      const key = `${areaKey}_${dateKey}`;
      
      if (!acc[key]) {
        acc[key] = {
          area: areaKey,
          date: dateKey,
          evaluations: [],
          totalEvaluations: 0,
          averageCompliance: 0,
        };
      }
      acc[key].evaluations.push(evaluation.compliancePercentage);
      acc[key].totalEvaluations++;
      return acc;
    }, {} as Record<string, any>);

    // Calcular promedios por área y fecha
    const chartData = Object.values(areaDateStats).map((item: any) => {
      item.averageCompliance = item.evaluations.reduce((sum: number, comp: number) => sum + comp, 0) / item.totalEvaluations;
      item.averageCompliance = Math.round(item.averageCompliance * 100) / 100;
      delete item.evaluations;
      return item;
    });

    // Agrupar por área para estadísticas
    const areaStats = chartData.reduce((acc, item) => {
      if (!acc[item.area]) {
        acc[item.area] = {
          area: item.area,
          dataPoints: [],
          averageCompliance: 0,
          trend: 'stable',
        };
      }
      acc[item.area].dataPoints.push({
        date: item.date,
        compliance: item.averageCompliance,
      });
      return acc;
    }, {} as Record<string, any>);

    // Calcular promedios y tendencias por área
    Object.values(areaStats).forEach((area: any) => {
      const compliances = area.dataPoints.map((dp: any) => dp.compliance);
      area.averageCompliance = Math.round((compliances.reduce((sum: number, comp: number) => sum + comp, 0) / compliances.length) * 100) / 100;
      area.trend = this.calculateTrend(compliances);
    });

    return {
      chartData,
      areaStats: Object.values(areaStats),
      summary: {
        totalAreas: Object.keys(areaStats).length,
        period: {
          startDate: params.startDate,
          endDate: params.endDate,
        },
      },
    };
  }

  /**
   * Generar tabla resumen mensual (KPI-04)
   */
  async generateMonthlySummaryTable(params: GenerateReportDto): Promise<any> {
    const evaluations = await this.evaluationRepository.find({
      where: {
        evaluationDate: Between(new Date(params.startDate), new Date(params.endDate)),
        ...(params.areaIds?.length && { areaId: In(params.areaIds) }),
        ...(params.moduleIds?.length && { moduleId: In(params.moduleIds) }),
      },
      relations: ['operator', 'area', 'module'],
    });

    // Agrupar por mes
    const monthlyStats = evaluations.reduce((acc, evaluation) => {
      const date = new Date(evaluation.evaluationDate);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      if (!acc[monthKey]) {
        acc[monthKey] = {
          month: monthKey,
          totalEvaluations: 0,
          uniqueOperators: new Set(),
          complianceSum: 0,
          averageCompliance: 0,
          evaluatedOperatorsPercentage: 0,
        };
      }
      
      acc[monthKey].totalEvaluations++;
      acc[monthKey].uniqueOperators.add(evaluation.operatorId);
      acc[monthKey].complianceSum += evaluation.compliancePercentage;
      
      return acc;
    }, {} as Record<string, any>);

    // Obtener total de operarios activos para calcular porcentaje
    const totalActiveOperators = await this.operatorRepository.count({
      where: { status: OperatorStatus.ACTIVO },
    });

    // Calcular promedios y porcentajes
    const summaryTable = Object.values(monthlyStats).map((month: any) => {
      month.averageCompliance = Math.round((month.complianceSum / month.totalEvaluations) * 100) / 100;
      month.evaluatedOperatorsPercentage = Math.round((month.uniqueOperators.size / totalActiveOperators) * 100 * 100) / 100;
      month.uniqueOperatorsCount = month.uniqueOperators.size;
      delete month.uniqueOperators;
      delete month.complianceSum;
      return month;
    });

    return {
      summaryTable: summaryTable.sort((a, b) => a.month.localeCompare(b.month)),
      totals: {
        totalActiveOperators,
        period: {
          startDate: params.startDate,
          endDate: params.endDate,
        },
      },
    };
  }

  /**
   * Generar matriz de razones por área (heatmap) (KPI-05)
   */
  async generateReasonsMatrixByArea(params: GenerateReportDto): Promise<any> {
    const evaluations = await this.evaluationRepository.find({
      where: {
        evaluationDate: Between(new Date(params.startDate), new Date(params.endDate)),
        ...(params.areaIds?.length && { areaId: In(params.areaIds) }),
        ...(params.moduleIds?.length && { moduleId: In(params.moduleIds) }),
      },
      relations: ['area', 'details', 'details.parameter'],
    });

    // Obtener todas las áreas
    const areas = await this.areaRepository.find({
      where: params.areaIds?.length ? { id: In(params.areaIds) } : {},
    });

    // Crear matriz de razones de no cumplimiento por área
    const reasonsMatrix: Record<string, Record<string, number>> = {};
    const reasonsCount: Record<string, number> = {};

    evaluations.forEach(evaluation => {
      const areaName = evaluation.area.name;
      
      if (!reasonsMatrix[areaName]) {
        reasonsMatrix[areaName] = {};
      }

      evaluation.details.forEach(detail => {
        if (!detail.isCompliant) {
          const reason = detail.parameter.name;
          
          if (!reasonsMatrix[areaName][reason]) {
            reasonsMatrix[areaName][reason] = 0;
          }
          if (!reasonsCount[reason]) {
            reasonsCount[reason] = 0;
          }
          
          reasonsMatrix[areaName][reason]++;
          reasonsCount[reason]++;
        }
      });
    });

    // Convertir a formato de heatmap
    const heatmapData = areas.map(area => {
      const areaData = reasonsMatrix[area.name] || {};
      const areaReasons = Object.keys(reasonsCount).map(reason => ({
        reason,
        count: areaData[reason] || 0,
        intensity: areaData[reason] ? Math.round((areaData[reason] / reasonsCount[reason]) * 100) : 0,
      }));

      return {
        area: area.name,
        reasons: areaReasons,
        totalNonCompliances: Object.values(areaData).reduce((sum: number, count: number) => sum + count, 0),
      };
    });

    // Obtener top razones globales
    const topReasons = Object.entries(reasonsCount)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([reason, count]) => ({ reason, count }));

    return {
      heatmapData,
      topReasons,
      summary: {
        totalAreas: areas.length,
        totalReasons: Object.keys(reasonsCount).length,
        totalNonCompliances: Object.values(reasonsCount).reduce((sum, count) => sum + count, 0),
        period: {
          startDate: params.startDate,
          endDate: params.endDate,
        },
      },
    };
  }

  /**
   * Generar observaciones y recomendaciones (KPI-06)
   */
  async generateObservationsAndRecommendations(params: GenerateReportDto): Promise<any> {
    const evaluations = await this.evaluationRepository.find({
      where: {
        evaluationDate: Between(new Date(params.startDate), new Date(params.endDate)),
        ...(params.areaIds?.length && { areaId: In(params.areaIds) }),
        ...(params.moduleIds?.length && { moduleId: In(params.moduleIds) }),
      },
      relations: ['area', 'module', 'operator', 'details', 'details.parameter'],
    });

    // Análisis de hallazgos
    const findings: Finding[] = [];
    const recommendations: Recommendation[] = [];

    // 1. Análisis de cumplimiento general
    const totalEvaluations = evaluations.length;
    const averageCompliance = evaluations.reduce((sum, evaluation) => sum + evaluation.compliancePercentage, 0) / totalEvaluations;
    
    if (averageCompliance < 80) {
      findings.push({
        type: 'critical',
        title: 'Cumplimiento General Bajo',
        description: `El promedio de cumplimiento general es de ${Math.round(averageCompliance * 100) / 100}%, por debajo del objetivo del 80%.`,
        impact: 'Alto',
      });
      recommendations.push({
        priority: 'Alta',
        category: 'Capacitación',
        title: 'Programa de Capacitación Intensiva',
        description: 'Implementar programa de capacitación intensiva para mejorar el cumplimiento general.',
        expectedImpact: 'Incremento del 10-15% en cumplimiento',
      });
    }

    // 2. Análisis por área
    const areaStats = evaluations.reduce((acc, evaluation) => {
      const areaName = evaluation.area.name;
      if (!acc[areaName]) {
        acc[areaName] = { evaluations: [], compliance: 0 };
      }
      acc[areaName].evaluations.push(evaluation.compliancePercentage);
      return acc;
    }, {} as Record<string, any>);

    Object.entries(areaStats).forEach(([areaName, stats]: [string, any]) => {
      const areaAverage = stats.evaluations.reduce((sum: number, comp: number) => sum + comp, 0) / stats.evaluations.length;
      stats.compliance = Math.round(areaAverage * 100) / 100;
      
      if (areaAverage < 75) {
        findings.push({
          type: 'warning',
          title: `Área ${areaName} con Bajo Rendimiento`,
          description: `El área ${areaName} tiene un promedio de cumplimiento de ${stats.compliance}%.`,
          impact: 'Medio',
        });
        recommendations.push({
          priority: 'Media',
          category: 'Supervisión',
          title: `Reforzar Supervisión en ${areaName}`,
          description: `Incrementar la frecuencia de supervisión y feedback en el área ${areaName}.`,
          expectedImpact: 'Incremento del 5-10% en cumplimiento del área',
        });
      }
    });

    // 3. Análisis de parámetros más problemáticos
    const parameterIssues: Record<string, number> = {};
    evaluations.forEach(evaluation => {
      evaluation.details.forEach(detail => {
        if (!detail.isCompliant) {
          const parameterName = detail.parameter.name;
          parameterIssues[parameterName] = (parameterIssues[parameterName] || 0) + 1;
        }
      });
    });

    const topIssues = Object.entries(parameterIssues)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5);

    topIssues.forEach(([parameter, count]) => {
      const percentage = Math.round((count / totalEvaluations) * 100 * 100) / 100;
      if (percentage > 20) {
        findings.push({
          type: 'warning',
          title: `Parámetro Problemático: ${parameter}`,
          description: `El parámetro "${parameter}" presenta incumplimiento en ${percentage}% de las evaluaciones.`,
          impact: 'Medio',
        });
        recommendations.push({
          priority: 'Media',
          category: 'Proceso',
          title: `Revisar Proceso para ${parameter}`,
          description: `Analizar y mejorar el proceso relacionado con "${parameter}" para reducir incumplimientos.`,
          expectedImpact: `Reducción del ${Math.round(percentage / 2)}% en incumplimientos de este parámetro`,
        });
      }
    });

    // 4. Análisis de tendencias
    const sortedEvaluations = evaluations.sort((a, b) => new Date(a.evaluationDate).getTime() - new Date(b.evaluationDate).getTime());
    const firstHalf = sortedEvaluations.slice(0, Math.floor(sortedEvaluations.length / 2));
    const secondHalf = sortedEvaluations.slice(Math.floor(sortedEvaluations.length / 2));
    
    const firstHalfAvg = firstHalf.reduce((sum, evaluation) => sum + evaluation.compliancePercentage, 0) / firstHalf.length;
    const secondHalfAvg = secondHalf.reduce((sum, evaluation) => sum + evaluation.compliancePercentage, 0) / secondHalf.length;
    
    if (secondHalfAvg < firstHalfAvg - 5) {
      findings.push({
        type: 'critical',
        title: 'Tendencia Negativa Detectada',
        description: `Se observa una tendencia negativa en el cumplimiento durante el período analizado.`,
        impact: 'Alto',
      });
      recommendations.push({
        priority: 'Alta',
        category: 'Monitoreo',
        title: 'Implementar Monitoreo Continuo',
        description: 'Establecer sistema de monitoreo continuo para detectar y corregir tendencias negativas tempranamente.',
        expectedImpact: 'Estabilización de la tendencia de cumplimiento',
      });
    }

    return {
      findings: findings.sort((a, b) => {
        const priorityOrder = { critical: 3, warning: 2, info: 1 };
        return priorityOrder[b.type] - priorityOrder[a.type];
      }),
      recommendations: recommendations.sort((a, b) => {
        const priorityOrder = { Alta: 3, Media: 2, Baja: 1 };
        return priorityOrder[b.priority] - priorityOrder[a.priority];
      }),
      summary: {
        totalFindings: findings.length,
        totalRecommendations: recommendations.length,
        criticalFindings: findings.filter(f => f.type === 'critical').length,
        highPriorityRecommendations: recommendations.filter(r => r.priority === 'Alta').length,
        period: {
          startDate: params.startDate,
          endDate: params.endDate,
        },
      },
    };
  }

  /**
   * Generar archivo según formato
   */
  private async generateFile(data: any, format: ReportFormat, filePath: string): Promise<void> {
    switch (format) {
      case ReportFormat.JSON:
        fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
        break;
      
      case ReportFormat.CSV:
        // Implementar generación de CSV
        const csv = this.convertToCSV(data);
        fs.writeFileSync(filePath, csv);
        break;
      
      case ReportFormat.PDF:
        // Implementar generación de PDF (requiere librería adicional)
        throw new BadRequestException('Formato PDF no implementado aún');
      
      case ReportFormat.EXCEL:
        // Implementar generación de Excel (requiere librería adicional)
        throw new BadRequestException('Formato Excel no implementado aún');
      
      default:
        throw new BadRequestException('Formato no soportado');
    }
  }

  /**
   * Convertir datos a CSV
   */
  private convertToCSV(data: any): string {
    if (!data.evaluations || !Array.isArray(data.evaluations)) {
      return 'No hay datos para exportar';
    }

    const headers = [
      'ID',
      'Operario ID',
      'Operario',
      'Área',
      'Módulo',
      'Cuadrante',
      'Fecha',
      'Hora',
      'Cumplimiento %',
      'Puntaje Final',
      'Estado',
      'Observaciones',
    ];

    if (data.evaluations.length === 0) {
      return headers.map(header => `"${header}"`).join(',');
    }

    const rows = data.evaluations.map((evaluation: any) => [
      evaluation.id,
      evaluation.operator.employeeId,
      evaluation.operator.fullName,
      evaluation.area,
      evaluation.module,
      evaluation.quadrant,
      evaluation.evaluationDate,
      evaluation.evaluationTime,
      evaluation.compliancePercentage,
      evaluation.finalScore,
      evaluation.status,
      evaluation.generalObservations || '',
    ]);

    return [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
  }

  /**
   * Calcular tendencia
   */
  private calculateTrend(values: number[]): 'up' | 'down' | 'stable' {
    if (values.length < 2) return 'stable';
    
    const first = values.slice(0, Math.ceil(values.length / 2));
    const second = values.slice(Math.floor(values.length / 2));
    
    const firstAvg = first.reduce((sum, val) => sum + val, 0) / first.length;
    const secondAvg = second.reduce((sum, val) => sum + val, 0) / second.length;
    
    const diff = secondAvg - firstAvg;
    
    if (diff > 2) return 'up';
    if (diff < -2) return 'down';
    return 'stable';
  }

  /**
   * Formatear fecha para nombre de archivo
   */
  private formatDateForFile(date: string): string {
    return date.replace(/-/g, '');
  }

  /**
   * Obtener extensión de archivo según formato
   */
  private getFileExtension(format: ReportFormat): string {
    switch (format) {
      case ReportFormat.JSON: return 'json';
      case ReportFormat.CSV: return 'csv';
      case ReportFormat.PDF: return 'pdf';
      case ReportFormat.EXCEL: return 'xlsx';
      default: return 'txt';
    }
  }

  /**
   * Generar reporte individual de operario (KPI-07)
   */
  async generateIndividualOperatorReport(operatorId: number, params: GenerateReportDto): Promise<any> {
    const operator = await this.operatorRepository.findOne({
      where: { id: operatorId },
      relations: ['area', 'module', 'roseVariety'],
    });

    if (!operator) {
      throw new NotFoundException('Operario no encontrado');
    }

    const evaluations = await this.evaluationRepository.find({
      where: {
        operatorId: operatorId,
        evaluationDate: Between(new Date(params.startDate), new Date(params.endDate)),
      },
      relations: ['details', 'details.parameter'],
      order: { evaluationDate: 'ASC' },
    });

    // Perfil del operario (KPI-08)
    const operatorProfile = {
      id: operator.id,
      employeeId: operator.employeeId,
      fullName: operator.fullName,
      area: operator.area.name,
      module: operator.module.name,
      quadrant: operator.quadrantCode,
      hireDate: operator.hireDate,
      hasDisability: operator.hasDisability,
      disabilityDescription: operator.disabilityDescription,
      roseVariety: operator.roseVariety?.name,
      status: operator.status,
    };

    // Estadísticas generales
    const totalEvaluations = evaluations.length;
    const averageCompliance = totalEvaluations > 0 
      ? evaluations.reduce((sum, evaluation) => sum + evaluation.compliancePercentage, 0) / totalEvaluations
      : 0;

    const bestScore = totalEvaluations > 0 ? Math.max(...evaluations.map(e => e.compliancePercentage)) : 0;
    const worstScore = totalEvaluations > 0 ? Math.min(...evaluations.map(e => e.compliancePercentage)) : 0;
    const trend = this.calculateTrend(evaluations.map(e => e.compliancePercentage));

    // Tabla código-promedio-objetivo (KPI-09)
    const parameterStats = await this.generateParameterStatsTable(evaluations);

    // Gráfico de rendimiento individual (KPI-10)
    const performanceChart = this.generateIndividualPerformanceChart(evaluations, averageCompliance);

    return {
      operatorProfile,
      statistics: {
        totalEvaluations,
        averageCompliance: Math.round(averageCompliance * 100) / 100,
        bestScore,
        worstScore,
        trend,
        objective: 100, // Objetivo siempre es 100%
      },
      parameterStats,
      performanceChart,
      period: {
        startDate: params.startDate,
        endDate: params.endDate,
      },
    };
  }

  /**
   * Generar tabla de estadísticas por parámetro (KPI-09)
   */
  private async generateParameterStatsTable(evaluations: Evaluation[]): Promise<any[]> {
    const parameterMap = new Map<string, { 
      parameter: string; 
      code: string; 
      totalEvaluations: number; 
      compliantCount: number; 
      nonCompliantCount: number; 
      complianceRate: number; 
      objective: number; 
    }>();

    evaluations.forEach(evaluation => {
      evaluation.details.forEach(detail => {
        const parameterKey = detail.parameter.code || detail.parameter.name;
        
        if (!parameterMap.has(parameterKey)) {
          parameterMap.set(parameterKey, {
            parameter: detail.parameter.name,
            code: parameterKey,
            totalEvaluations: 0,
            compliantCount: 0,
            nonCompliantCount: 0,
            complianceRate: 0,
            objective: 100, // Objetivo siempre es 100%
          });
        }

        const stats = parameterMap.get(parameterKey)!;
        stats.totalEvaluations++;
        
        if (detail.isCompliant) {
          stats.compliantCount++;
        } else {
          stats.nonCompliantCount++;
        }
      });
    });

    // Calcular porcentajes de cumplimiento
    const parameterStats = Array.from(parameterMap.values()).map(stats => ({
      ...stats,
      complianceRate: Math.round((stats.compliantCount / stats.totalEvaluations) * 100 * 100) / 100,
    }));

    return parameterStats.sort((a, b) => a.parameter.localeCompare(b.parameter));
  }

  /**
   * Generar datos para gráfico de rendimiento individual (KPI-10)
   */
  private generateIndividualPerformanceChart(evaluations: Evaluation[], finalAverage: number): any {
    const chartData = evaluations.map(evaluation => ({
      date: evaluation.evaluationDate,
      time: evaluation.evaluationTime,
      compliance: evaluation.compliancePercentage,
      score: evaluation.finalScore,
    }));

    return {
      data: chartData,
      finalAverage: Math.round(finalAverage * 100) / 100,
      objective: 100, // Línea de objetivo al 100%
      trend: this.calculateTrend(evaluations.map(e => e.compliancePercentage)),
    };
  }

  /**
   * Obtener historial de evaluaciones con filtros comprehensivos (KPI-13)
   */
  async getEvaluationHistory(filters: {
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
    const queryBuilder = this.evaluationRepository.createQueryBuilder('evaluation')
      .leftJoinAndSelect('evaluation.operator', 'operator')
      .leftJoinAndSelect('evaluation.area', 'area')
      .leftJoinAndSelect('evaluation.module', 'module')
      .leftJoinAndSelect('evaluation.details', 'details')
      .leftJoinAndSelect('details.parameter', 'parameter')
      .leftJoinAndSelect('evaluation.photos', 'photos');

    if (filters.operatorId) {
      queryBuilder.andWhere('evaluation.operatorId = :operatorId', { operatorId: filters.operatorId });
    }

    if (filters.quadrantCode) {
      queryBuilder.andWhere('evaluation.quadrantCode = :quadrantCode', { quadrantCode: filters.quadrantCode });
    }

    if (filters.areaId) {
      queryBuilder.andWhere('evaluation.areaId = :areaId', { areaId: filters.areaId });
    }

    if (filters.moduleId) {
      queryBuilder.andWhere('evaluation.moduleId = :moduleId', { moduleId: filters.moduleId });
    }

    if (filters.startDate && filters.endDate) {
      queryBuilder.andWhere('evaluation.evaluationDate BETWEEN :startDate AND :endDate', {
        startDate: filters.startDate,
        endDate: filters.endDate,
      });
    }

    if (filters.minCompliance !== undefined) {
      queryBuilder.andWhere('evaluation.compliancePercentage >= :minCompliance', { 
        minCompliance: filters.minCompliance 
      });
    }

    if (filters.maxCompliance !== undefined) {
      queryBuilder.andWhere('evaluation.compliancePercentage <= :maxCompliance', { 
        maxCompliance: filters.maxCompliance 
      });
    }

    if (filters.status) {
      queryBuilder.andWhere('evaluation.status = :status', { status: filters.status });
    }

    queryBuilder.orderBy('evaluation.evaluationDate', 'DESC')
      .addOrderBy('evaluation.evaluationTime', 'DESC');

    const evaluations = await queryBuilder.getMany();

    return {
      totalRecords: evaluations.length,
      filters: filters,
      evaluations: evaluations.map(evaluation => ({
        id: evaluation.id,
        operator: {
          id: evaluation.operator.id,
          employeeId: evaluation.operator.employeeId,
          fullName: evaluation.operator.fullName,
        },
        area: evaluation.area.name,
        module: evaluation.module.name,
        quadrant: evaluation.quadrantCode,
        evaluationDate: evaluation.evaluationDate,
        evaluationTime: evaluation.evaluationTime,
        compliancePercentage: evaluation.compliancePercentage,
        finalScore: evaluation.finalScore,
        status: evaluation.status,
        generalObservations: evaluation.generalObservations,
        totalPhotos: evaluation.photos?.length || 0,
        nonCompliantParameters: evaluation.details.filter(d => !d.isCompliant).length,
        totalParameters: evaluation.details.length,
      })),
    };
  }

  /**
   * Obtener lista de operarios para selección de reportes individuales (KPI-07)
   */
  async getOperatorsForReports(filters?: {
    areaId?: number;
    moduleId?: number;
    status?: string;
    search?: string;
  }): Promise<any[]> {
    const queryBuilder = this.operatorRepository.createQueryBuilder('operator')
      .leftJoinAndSelect('operator.area', 'area')
      .leftJoinAndSelect('operator.module', 'module')
      .leftJoinAndSelect('operator.roseVariety', 'roseVariety');

    if (filters?.areaId) {
      queryBuilder.andWhere('operator.areaId = :areaId', { areaId: filters.areaId });
    }

    if (filters?.moduleId) {
      queryBuilder.andWhere('operator.moduleId = :moduleId', { moduleId: filters.moduleId });
    }

    if (filters?.status) {
      queryBuilder.andWhere('operator.status = :status', { status: filters.status });
    }

    if (filters?.search) {
      queryBuilder.andWhere(
        '(operator.fullName ILIKE :search OR operator.employeeId ILIKE :search)',
        { search: `%${filters.search}%` }
      );
    }

    queryBuilder.orderBy('operator.fullName', 'ASC');

    const operators = await queryBuilder.getMany();

    return operators.map(operator => ({
      id: operator.id,
      employeeId: operator.employeeId,
      fullName: operator.fullName,
      area: operator.area.name,
      module: operator.module.name,
      quadrant: operator.quadrantCode,
      status: operator.status,
      roseVariety: operator.roseVariety?.name,
    }));
  }

  /**
   * Generar datos optimizados para dashboard externo
   */
  async getExternalDashboardData(filters: {
    startDate: string;
    endDate: string;
    areaIds?: number[];
    moduleIds?: number[];
  }): Promise<any> {
    const evaluations = await this.evaluationRepository.find({
      where: {
        evaluationDate: Between(new Date(filters.startDate), new Date(filters.endDate)),
        ...(filters.areaIds?.length && { areaId: In(filters.areaIds) }),
        ...(filters.moduleIds?.length && { moduleId: In(filters.moduleIds) }),
      },
      relations: ['operator', 'area', 'module', 'details', 'details.parameter'],
    });

    // Gráficos comparativos por área
    const areaComparison = await this.generateAreaComparisonChart(evaluations);

    // Rankings Top/Bottom 5 operarios
    const operatorRankings = await this.generateOperatorRankings(evaluations);

    // Análisis de Pareto de razones (80/20)
    const paretoAnalysis = await this.generateParetoAnalysis(evaluations);

    // Barras apiladas razones × área
    const stackedBarsData = await this.generateStackedBarsData(evaluations);

    // Heatmap área vs semana
    const heatmapData = await this.generateAreaWeekHeatmap(evaluations, filters);

    // Tendencia global con bandas de control
    const globalTrend = await this.generateGlobalTrendWithControlBands(evaluations);

    // Gráficos de radar
    const radarCharts = await this.generateRadarCharts(evaluations);

    // Boxplots por operario
    const boxplotData = await this.generateBoxplotsByOperator(evaluations);

    return {
      period: {
        startDate: filters.startDate,
        endDate: filters.endDate,
      },
      charts: {
        areaComparison,
        operatorRankings,
        paretoAnalysis,
        stackedBars: stackedBarsData,
        heatmap: heatmapData,
        globalTrend,
        radarCharts,
        boxplots: boxplotData,
      },
    };
  }

  /**
   * Generar gráfico comparativo por área
   */
  private async generateAreaComparisonChart(evaluations: Evaluation[]): Promise<any> {
    const areaStats = evaluations.reduce((acc, evaluation) => {
      const areaName = evaluation.area.name;
      if (!acc[areaName]) {
        acc[areaName] = {
          name: areaName,
          totalEvaluations: 0,
          totalCompliance: 0,
          averageCompliance: 0,
        };
      }
      acc[areaName].totalEvaluations++;
      acc[areaName].totalCompliance += evaluation.compliancePercentage;
      return acc;
    }, {} as Record<string, any>);

    const chartData = Object.values(areaStats).map((area: any) => ({
      area: area.name,
      averageCompliance: Math.round((area.totalCompliance / area.totalEvaluations) * 100) / 100,
      totalEvaluations: area.totalEvaluations,
    }));

    return {
      type: 'bar',
      title: 'Comparación de Cumplimiento por Área',
      data: chartData.sort((a, b) => b.averageCompliance - a.averageCompliance),
    };
  }

  /**
   * Generar rankings Top/Bottom 5 operarios
   */
  private async generateOperatorRankings(evaluations: Evaluation[]): Promise<any> {
    const operatorStats = evaluations.reduce((acc, evaluation) => {
      const operatorKey = `${evaluation.operator.id}-${evaluation.operator.fullName}`;
      if (!acc[operatorKey]) {
        acc[operatorKey] = {
          id: evaluation.operator.id,
          name: evaluation.operator.fullName,
          employeeId: evaluation.operator.employeeId,
          totalEvaluations: 0,
          totalCompliance: 0,
          averageCompliance: 0,
        };
      }
      acc[operatorKey].totalEvaluations++;
      acc[operatorKey].totalCompliance += evaluation.compliancePercentage;
      return acc;
    }, {} as Record<string, any>);

    const rankedOperators = Object.values(operatorStats)
      .map((operator: any) => ({
        ...operator,
        averageCompliance: Math.round((operator.totalCompliance / operator.totalEvaluations) * 100) / 100,
      }))
      .sort((a, b) => b.averageCompliance - a.averageCompliance);

    return {
      top5: rankedOperators.slice(0, 5),
      bottom5: rankedOperators.slice(-5).reverse(),
    };
  }

  /**
   * Generar análisis de Pareto de razones (80/20)
   */
  private async generateParetoAnalysis(evaluations: Evaluation[]): Promise<any> {
    const reasonCounts = evaluations.reduce((acc, evaluation) => {
      evaluation.details.forEach(detail => {
        if (!detail.isCompliant) {
          const reason = detail.parameter.name;
          acc[reason] = (acc[reason] || 0) + 1;
        }
      });
      return acc;
    }, {} as Record<string, number>);

    const sortedReasons = Object.entries(reasonCounts)
      .sort(([, a], [, b]) => b - a)
      .map(([reason, count]) => ({ reason, count }));

    const totalCount = sortedReasons.reduce((sum, item) => sum + item.count, 0);
    let cumulativeCount = 0;
    const paretoData = sortedReasons.map(item => {
      cumulativeCount += item.count;
      return {
        reason: item.reason,
        count: item.count,
        percentage: Math.round((item.count / totalCount) * 100 * 100) / 100,
        cumulativePercentage: Math.round((cumulativeCount / totalCount) * 100 * 100) / 100,
      };
    });

    return {
      type: 'pareto',
      title: 'Análisis de Pareto - Razones de No Cumplimiento',
      data: paretoData,
      pareto80: paretoData.findIndex(item => item.cumulativePercentage >= 80) + 1,
    };
  }

  /**
   * Generar datos para barras apiladas razones × área
   */
  private async generateStackedBarsData(evaluations: Evaluation[]): Promise<any> {
    const stackedData = evaluations.reduce((acc, evaluation) => {
      const areaName = evaluation.area.name;
      if (!acc[areaName]) {
        acc[areaName] = {};
      }

      evaluation.details.forEach(detail => {
        if (!detail.isCompliant) {
          const reason = detail.parameter.name;
          acc[areaName][reason] = (acc[areaName][reason] || 0) + 1;
        }
      });
      return acc;
    }, {} as Record<string, Record<string, number>>);

    return {
      type: 'stackedBar',
      title: 'Razones de No Cumplimiento por Área',
      data: stackedData,
    };
  }

  /**
   * Generar heatmap área vs semana
   */
  private async generateAreaWeekHeatmap(evaluations: Evaluation[], filters: any): Promise<any> {
    const heatmapData = evaluations.reduce((acc, evaluation) => {
      const areaName = evaluation.area.name;
      const weekNumber = this.getWeekNumber(evaluation.evaluationDate);
      const key = `${areaName}-W${weekNumber}`;

      if (!acc[key]) {
        acc[key] = {
          area: areaName,
          week: weekNumber,
          totalEvaluations: 0,
          totalCompliance: 0,
          averageCompliance: 0,
        };
      }

      acc[key].totalEvaluations++;
      acc[key].totalCompliance += evaluation.compliancePercentage;
      return acc;
    }, {} as Record<string, any>);

    const processedData = Object.values(heatmapData).map((cell: any) => ({
      ...cell,
      averageCompliance: Math.round((cell.totalCompliance / cell.totalEvaluations) * 100) / 100,
    }));

    return {
      type: 'heatmap',
      title: 'Heatmap Área vs Semana',
      data: processedData,
    };
  }

  /**
   * Generar tendencia global con bandas de control
   */
  private async generateGlobalTrendWithControlBands(evaluations: Evaluation[]): Promise<any> {
    const dailyData = evaluations.reduce((acc, evaluation) => {
      const dateKey = evaluation.evaluationDate.toISOString().split('T')[0];
      if (!acc[dateKey]) {
        acc[dateKey] = {
          date: dateKey,
          evaluations: [],
          average: 0,
        };
      }
      acc[dateKey].evaluations.push(evaluation.compliancePercentage);
      return acc;
    }, {} as Record<string, any>);

    const trendData = Object.values(dailyData).map((day: any) => {
      const average = day.evaluations.reduce((sum: number, val: number) => sum + val, 0) / day.evaluations.length;
      return {
        date: day.date,
        average: Math.round(average * 100) / 100,
        count: day.evaluations.length,
      };
    }).sort((a, b) => a.date.localeCompare(b.date));

    // Calcular bandas de control (±2 desviaciones estándar)
    const overallAverage = trendData.reduce((sum, day) => sum + day.average, 0) / trendData.length;
    const variance = trendData.reduce((sum, day) => sum + Math.pow(day.average - overallAverage, 2), 0) / trendData.length;
    const standardDeviation = Math.sqrt(variance);

    return {
      type: 'line',
      title: 'Tendencia Global con Bandas de Control',
      data: trendData,
      controlBands: {
        centerLine: Math.round(overallAverage * 100) / 100,
        upperControlLimit: Math.round((overallAverage + 2 * standardDeviation) * 100) / 100,
        lowerControlLimit: Math.round((overallAverage - 2 * standardDeviation) * 100) / 100,
      },
    };
  }

  /**
   * Generar gráficos de radar
   */
  private async generateRadarCharts(evaluations: Evaluation[]): Promise<any> {
    const parameterStats = evaluations.reduce((acc, evaluation) => {
      evaluation.details.forEach(detail => {
        const parameterName = detail.parameter.name;
        if (!acc[parameterName]) {
          acc[parameterName] = {
            parameter: parameterName,
            totalEvaluations: 0,
            compliantCount: 0,
            complianceRate: 0,
          };
        }
        acc[parameterName].totalEvaluations++;
        if (detail.isCompliant) {
          acc[parameterName].compliantCount++;
        }
      });
      return acc;
    }, {} as Record<string, any>);

    const radarData = Object.values(parameterStats).map((param: any) => ({
      parameter: param.parameter,
      complianceRate: Math.round((param.compliantCount / param.totalEvaluations) * 100 * 100) / 100,
    }));

    return {
      type: 'radar',
      title: 'Cumplimiento por Parámetro',
      data: radarData,
    };
  }

  /**
   * Generar boxplots por operario
   */
  private async generateBoxplotsByOperator(evaluations: Evaluation[]): Promise<any> {
    const operatorData = evaluations.reduce((acc, evaluation) => {
      const operatorName = evaluation.operator.fullName;
      if (!acc[operatorName]) {
        acc[operatorName] = [];
      }
      acc[operatorName].push(evaluation.compliancePercentage);
      return acc;
    }, {} as Record<string, number[]>);

    const boxplotData = Object.entries(operatorData).map(([operatorName, values]) => {
      const sortedValues = values.sort((a, b) => a - b);
      const q1Index = Math.floor(sortedValues.length * 0.25);
      const q3Index = Math.floor(sortedValues.length * 0.75);
      const medianIndex = Math.floor(sortedValues.length * 0.5);

      return {
        operator: operatorName,
        min: sortedValues[0],
        q1: sortedValues[q1Index],
        median: sortedValues[medianIndex],
        q3: sortedValues[q3Index],
        max: sortedValues[sortedValues.length - 1],
        count: values.length,
      };
    });

    return {
      type: 'boxplot',
      title: 'Distribución de Cumplimiento por Operario',
      data: boxplotData,
    };
  }

  /**
   * Obtener número de semana del año
   */
  private getWeekNumber(date: Date): number {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  }

  /**
   * Exportar reporte a múltiples formatos
   */
  async exportReport(reportData: ReportData, format: ReportFormat): Promise<string> {
    const fileName = `${reportData.fileName.split('.')[0]}.${this.getFileExtension(format)}`;
    const filePath = path.join(this.reportsDir, fileName);

    switch (format) {
      case ReportFormat.JSON:
        fs.writeFileSync(filePath, JSON.stringify(reportData.data, null, 2));
        break;
      
      case ReportFormat.CSV:
        const csv = this.convertToCSV(reportData.data);
        fs.writeFileSync(filePath, csv);
        break;
      
      case ReportFormat.PDF:
        await this.generatePDFReport(reportData.data, filePath);
        break;
      
      case ReportFormat.EXCEL:
        await this.generateExcelReport(reportData.data, filePath);
        break;
      
      default:
        throw new BadRequestException('Formato de exportación no soportado');
    }

    return fileName;
  }

  /**
   * Generar reporte PDF (implementación básica)
   */
  private async generatePDFReport(data: any, filePath: string): Promise<void> {
    // Implementación básica - en producción se usaría una librería como puppeteer o jsPDF
    const htmlContent = this.generateHTMLReport(data);
    
    // Por ahora, guardamos como HTML hasta implementar PDF real
    fs.writeFileSync(filePath.replace('.pdf', '.html'), htmlContent);
    
    // Placeholder para PDF real
    fs.writeFileSync(filePath, 'PDF generation not implemented yet');
  }

  /**
   * Generar reporte Excel (implementación básica)
   */
  private async generateExcelReport(data: any, filePath: string): Promise<void> {
    // Implementación básica - en producción se usaría una librería como exceljs
    const csv = this.convertToCSV(data);
    
    // Por ahora, guardamos como CSV hasta implementar Excel real
    fs.writeFileSync(filePath.replace('.xlsx', '.csv'), csv);
    
    // Placeholder para Excel real
    fs.writeFileSync(filePath, 'Excel generation not implemented yet');
  }

  /**
   * Generar contenido HTML para reportes
   */
  private generateHTMLReport(data: any): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Reporte QCSER</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          table { border-collapse: collapse; width: 100%; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background-color: #f2f2f2; }
          .summary { background-color: #e7f3ff; padding: 15px; margin-bottom: 20px; }
        </style>
      </head>
      <body>
        <h1>Reporte de Evaluaciones QCSER</h1>
        <div class="summary">
          <h2>Resumen</h2>
          <p>Total de evaluaciones: ${data.summary?.totalEvaluations || 0}</p>
          <p>Promedio de cumplimiento: ${data.summary?.averageCompliance || 0}%</p>
          <p>Período: ${data.summary?.period?.startDate || ''} - ${data.summary?.period?.endDate || ''}</p>
        </div>
        <h2>Detalles</h2>
        <p>Datos del reporte en formato JSON:</p>
        <pre>${JSON.stringify(data, null, 2)}</pre>
      </body>
      </html>
    `;
  }}
