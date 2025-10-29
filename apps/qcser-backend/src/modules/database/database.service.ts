import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Area } from '../../entities/area.entity';
import { Module } from '../../entities/module.entity';
import { Subprocess } from '../../entities/subprocess.entity';
import { RoseVariety } from '../../entities/rose-variety.entity';
import { Supervisor } from '../../entities/supervisor.entity';
import { EvaluationParameter } from '../../entities/evaluation-parameter.entity';
import { Operator, OperatorStatus } from '../../entities/operator.entity';

@Injectable()
export class DatabaseService implements OnModuleInit {
  private readonly logger = new Logger(DatabaseService.name);

  constructor(
    @InjectRepository(Area)
    private readonly areaRepository: Repository<Area>,
    @InjectRepository(Module)
    private readonly moduleRepository: Repository<Module>,
    @InjectRepository(Subprocess)
    private readonly subprocessRepository: Repository<Subprocess>,
    @InjectRepository(RoseVariety)
    private readonly roseVarietyRepository: Repository<RoseVariety>,
    @InjectRepository(Supervisor)
    private readonly supervisorRepository: Repository<Supervisor>,
    @InjectRepository(EvaluationParameter)
    private readonly evaluationParameterRepository: Repository<EvaluationParameter>,
    @InjectRepository(Operator)
    private readonly operatorRepository: Repository<Operator>,
  ) {}

  async onModuleInit() {
    try {
      await this.seedInitialData();
    } catch (error) {
      this.logger.error('Error seeding initial data:', error);
    }
  }

  async seedInitialData() {
    this.logger.log('Starting initial data seeding...');

    // Check if data already exists
    const areaCount = await this.areaRepository.count();
    if (areaCount > 0) {
      this.logger.log('Data already exists, skipping seed...');
      return;
    }

    // Seed Areas
    const areas = await this.seedAreas();
    this.logger.log(`Seeded ${areas.length} areas`);

    // Seed Modules
    const modules = await this.seedModules(areas);
    this.logger.log(`Seeded ${modules.length} modules`);

    // Seed Subprocesses
    const subprocesses = await this.seedSubprocesses(modules);
    this.logger.log(`Seeded ${subprocesses.length} subprocesses`);

    // Seed Rose Varieties
    const roseVarieties = await this.seedRoseVarieties();
    this.logger.log(`Seeded ${roseVarieties.length} rose varieties`);

    // Seed Supervisors
    const supervisors = await this.seedSupervisors(areas);
    this.logger.log(`Seeded ${supervisors.length} supervisors`);

    // Seed Evaluation Parameters
    const parameters = await this.seedEvaluationParameters(subprocesses);
    this.logger.log(`Seeded ${parameters.length} evaluation parameters`);

    // Seed Operators
    const operators = await this.seedOperators(areas, modules, roseVarieties);
    this.logger.log(`Seeded ${operators.length} operators`);

    this.logger.log('Initial data seeding completed successfully!');
  }

  private async seedAreas(): Promise<Area[]> {
    const areasData = [
      { name: 'Área 1', code: 'A1', description: 'Primera área de producción' },
      { name: 'Área 2', code: 'A2', description: 'Segunda área de producción' },
      { name: 'Área 3', code: 'A3', description: 'Tercera área de producción' },
      { name: 'Área 4', code: 'A4', description: 'Cuarta área de producción' },
    ];

    const areas = areasData.map(data => this.areaRepository.create(data));
    return this.areaRepository.save(areas);
  }

  private async seedModules(areas: Area[]): Promise<Module[]> {
    const modulesData: any[] = [];
    
    for (let i = 0; i < areas.length; i++) {
      const area = areas[i];
      modulesData.push(
        { name: 'Cosecha', code: `COS_A${i+1}`, description: 'Módulo de cosecha de flores', areaId: area.id },
        { name: 'Post-Cosecha', code: `POST_A${i+1}`, description: 'Módulo de post-cosecha', areaId: area.id }
      );
    }

    const modules = this.moduleRepository.create(modulesData);
    return this.moduleRepository.save(modules);
  }

  private async seedSubprocesses(modules: Module[]): Promise<Subprocess[]> {
    const subprocessesData: any[] = [];
    
    for (const module of modules) {
      if (module.code.startsWith('COS_')) {
        // Cosecha subprocesses
        subprocessesData.push(
          { name: 'Enmallado', code: 'ENM', moduleId: module.id },
          { name: 'Cuadrante', code: 'CUA', moduleId: module.id }
        );
      } else if (module.code.startsWith('POST_')) {
        // Post-Cosecha subprocesses
        subprocessesData.push(
          { name: 'Recepción', code: 'REC', moduleId: module.id },
          { name: 'Clasificación', code: 'CLA', moduleId: module.id },
          { name: 'Boncheo', code: 'BON', moduleId: module.id },
          { name: 'Fin de Banda', code: 'FIN', moduleId: module.id },
          { name: 'Empaque', code: 'EMP', moduleId: module.id }
        );
      }
    }

    const subprocesses = this.subprocessRepository.create(subprocessesData);
    return this.subprocessRepository.save(subprocesses);
  }

  private async seedRoseVarieties(): Promise<RoseVariety[]> {
    const varietiesData = [
      { name: 'Freedom', code: 'FREE', description: 'Rosa Freedom - variedad premium' },
      { name: 'Explorer', code: 'EXPL', description: 'Rosa Explorer - variedad estándar' },
      { name: 'Mondial', code: 'MOND', description: 'Rosa Mondial - variedad clásica' },
      { name: 'Vendela', code: 'VEND', description: 'Rosa Vendela - variedad especial' },
      { name: 'Avalanche', code: 'AVAL', description: 'Rosa Avalanche - variedad blanca' },
      { name: 'Red Naomi', code: 'RNAM', description: 'Rosa Red Naomi - variedad roja' },
      { name: 'Tacazzi', code: 'TACA', description: 'Rosa Tacazzi - variedad rosada' },
    ];

    const varieties = varietiesData.map(data => this.roseVarietyRepository.create(data));
    return this.roseVarietyRepository.save(varieties);
  }

  private async seedSupervisors(areas: Area[]): Promise<Supervisor[]> {
    const supervisorsData = [
      { fullName: 'María González', employeeId: 'SUP001', areaId: areas[0].id },
      { fullName: 'Carlos Rodríguez', employeeId: 'SUP002', areaId: areas[1].id },
      { fullName: 'Ana Martínez', employeeId: 'SUP003', areaId: areas[2].id },
      { fullName: 'Luis Fernández', employeeId: 'SUP004', areaId: areas[3].id },
    ];

    const supervisors = supervisorsData.map(data => this.supervisorRepository.create(data));
    return this.supervisorRepository.save(supervisors);
  }

  private async seedEvaluationParameters(subprocesses: Subprocess[]): Promise<EvaluationParameter[]> {
    const parametersData: any[] = [];
    let parameterCounter = 1;

    for (const subprocess of subprocesses) {
      if (subprocess.code === 'ENM') {
        // Enmallado parameters
        const enmallParams = [
          { name: 'Uso correcto de EPP', description: 'Verificar uso adecuado de equipos de protección personal', weightPercentage: 5.00 },
          { name: 'Técnica de corte', description: 'Evaluación de la técnica correcta de corte de tallos', weightPercentage: 10.00 },
          { name: 'Selección de punto de corte', description: 'Verificar selección correcta del punto de corte', weightPercentage: 8.00 },
          { name: 'Manejo de herramientas', description: 'Uso adecuado y mantenimiento de herramientas de corte', weightPercentage: 7.00 },
          { name: 'Limpieza del área', description: 'Mantener limpia el área de trabajo', weightPercentage: 5.00 },
        ];

        enmallParams.forEach(param => {
          parametersData.push({
            ...param,
            code: `P${parameterCounter.toString().padStart(3, '0')}`,
            subprocessId: subprocess.id,
            version: 1,
            effectiveFrom: new Date(),
            effectiveTo: null,
            isActive: true
          });
          parameterCounter++;
        });
      } else if (subprocess.code === 'CUA') {
        // Cuadrante parameters
        const cuadranteParams = [
          { name: 'Organización del cuadrante', description: 'Verificar organización adecuada del área de trabajo', weightPercentage: 8.00 },
          { name: 'Calidad de selección', description: 'Evaluación de la calidad en selección de flores', weightPercentage: 12.00 },
          { name: 'Productividad', description: 'Cumplimiento de metas de productividad', weightPercentage: 10.00 },
          { name: 'Cuidado de las plantas', description: 'Manejo cuidadoso de las plantas durante la cosecha', weightPercentage: 8.00 },
          { name: 'Seguimiento de procedimientos', description: 'Adherencia a procedimientos establecidos', weightPercentage: 7.00 },
        ];

        cuadranteParams.forEach(param => {
          parametersData.push({
            ...param,
            code: `P${parameterCounter.toString().padStart(3, '0')}`,
            subprocessId: subprocess.id,
            version: 1,
            effectiveFrom: new Date(),
            effectiveTo: null,
            isActive: true
          });
          parameterCounter++;
        });
      }
    }

    const parameters = this.evaluationParameterRepository.create(parametersData);
    return this.evaluationParameterRepository.save(parameters);
  }

  private async seedOperators(areas: Area[], modules: Module[], roseVarieties: RoseVariety[]): Promise<Operator[]> {
    const operatorsData = [
      {
        employeeId: 'OP001',
        fullName: 'Juan Pérez',
        hireDate: new Date('2023-01-15'),
        hasDisability: false,
        moduleId: modules[0].id, // First Cosecha module
        areaId: areas[0].id,
        quadrantCode: 'Q001',
        roseVarietyId: roseVarieties[0].id,
        status: OperatorStatus.ACTIVO
      },
      {
        employeeId: 'OP002',
        fullName: 'María López',
        hireDate: new Date('2023-02-20'),
        hasDisability: false,
        moduleId: modules[0].id,
        areaId: areas[0].id,
        quadrantCode: 'Q002',
        roseVarietyId: roseVarieties[1].id,
        status: OperatorStatus.ACTIVO
      },
      {
        employeeId: 'OP003',
        fullName: 'Carlos Mendoza',
        hireDate: new Date('2023-03-10'),
        hasDisability: true,
        disabilityDescription: 'Discapacidad motriz leve en mano derecha',
        moduleId: modules[2].id, // First Cosecha module in Area 2
        areaId: areas[1].id,
        quadrantCode: 'Q003',
        roseVarietyId: roseVarieties[2].id,
        status: OperatorStatus.ACTIVO
      },
      {
        employeeId: 'OP004',
        fullName: 'Ana Torres',
        hireDate: new Date('2023-04-05'),
        hasDisability: false,
        moduleId: modules[2].id,
        areaId: areas[1].id,
        quadrantCode: 'Q004',
        roseVarietyId: roseVarieties[3].id,
        status: OperatorStatus.ACTIVO
      },
    ];

    const operators = this.operatorRepository.create(operatorsData);
    return this.operatorRepository.save(operators);
  }
}