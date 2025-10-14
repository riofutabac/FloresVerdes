import { User, UserRole } from '../../src/entities/user.entity';
import { Operator, OperatorStatus } from '../../src/entities/operator.entity';
import { Evaluation, EvaluationStatus } from '../../src/entities/evaluation.entity';
import { EvaluationDetail } from '../../src/entities/evaluation-detail.entity';
import { EvaluationPhoto } from '../../src/entities/evaluation-photo.entity';
import { Area } from '../../src/entities/area.entity';
import { Module } from '../../src/entities/module.entity';
import { RoseVariety } from '../../src/entities/rose-variety.entity';
import { EvaluationParameter } from '../../src/entities/evaluation-parameter.entity';
import { Subprocess } from '../../src/entities/subprocess.entity';
import { SyncLog } from '../../src/entities/sync-log.entity';

/**
 * Test data factory for creating mock entities
 * Following patterns from reference implementation
 */
export class TestDataFactory {
  private static counter = 1;

  private static getNextId(): number {
    return this.counter++;
  }

  private static getNextUuid(): string {
    return `test-uuid-${this.getNextId()}`;
  }

  // User factory methods
  static createUser(overrides: Partial<User> = {}): User {
    const id = this.getNextId();
    return {
      id: this.getNextUuid(),
      email: `user${id}@test.com`,
      fullName: `Test User ${id}`,
      role: UserRole.JEFA_CALIDAD,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      evaluations: [],
      ...overrides,
    };
  }

  static createAdminUser(overrides: Partial<User> = {}): User {
    return this.createUser({
      role: UserRole.ADMINISTRADOR,
      email: 'admin@test.com',
      fullName: 'Admin User',
      ...overrides,
    });
  }

  static createJefeCalidadUser(overrides: Partial<User> = {}): User {
    return this.createUser({
      role: UserRole.JEFA_CALIDAD,
      email: 'jefe@test.com',
      fullName: 'Jefe de Calidad',
      ...overrides,
    });
  }

  static createGerenteUser(overrides: Partial<User> = {}): User {
    return this.createUser({
      role: UserRole.GERENTE_GENERAL,
      email: 'gerente@test.com',
      fullName: 'Gerente General',
      ...overrides,
    });
  }

  // Area factory methods
  static createArea(overrides: Partial<Area> = {}): Area {
    const id = this.getNextId();
    return {
      id,
      name: `Area ${id}`,
      code: `A${id}`,
      description: `Test area ${id}`,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      modules: [],
      operators: [],
      evaluations: [],
      supervisors: [],
      ...overrides,
    };
  }

  // Module factory methods
  static createModule(overrides: Partial<Module> = {}): Module {
    const id = this.getNextId();
    return {
      id,
      name: `Module ${id}`,
      code: `M${id}`,
      description: `Test module ${id}`,
      areaId: 1,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      area: null,
      subprocesses: [],
      operators: [],
      evaluations: [],
      ...overrides,
    };
  }

  // Rose Variety factory methods
  static createRoseVariety(overrides: Partial<RoseVariety> = {}): RoseVariety {
    const id = this.getNextId();
    return {
      id,
      name: `Rose Variety ${id}`,
      code: `RV${id.toString().padStart(3, '0')}`,
      description: `Test rose variety ${id}`,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      operators: [],
      ...overrides,
    };
  }

  // Operator factory methods
  static createOperator(overrides: Partial<Operator> = {}): Operator {
    const id = this.getNextId();
    return {
      id,
      employeeId: `EMP${id.toString().padStart(3, '0')}`,
      fullName: `Test Operator ${id}`,
      hireDate: new Date('2023-01-01'),
      hasDisability: false,
      disabilityDescription: null,
      moduleId: 1,
      areaId: 1,
      quadrantCode: `Q${id}`,
      roseVarietyId: 1,
      status: OperatorStatus.ACTIVO,
      createdAt: new Date(),
      updatedAt: new Date(),
      module: null,
      area: null,
      roseVariety: null,
      evaluations: [],
      ...overrides,
    };
  }

  static createInactiveOperator(overrides: Partial<Operator> = {}): Operator {
    return this.createOperator({
      status: OperatorStatus.INACTIVO,
      ...overrides,
    });
  }

  static createOperatorWithDisability(overrides: Partial<Operator> = {}): Operator {
    return this.createOperator({
      hasDisability: true,
      disabilityDescription: 'Visual impairment',
      ...overrides,
    });
  }

  // Subprocess factory methods
  static createSubprocess(overrides: Partial<Subprocess> = {}): Subprocess {
    const id = this.getNextId();
    return {
      id,
      name: `Subprocess ${id}`,
      description: `Test subprocess ${id}`,
      moduleId: 1,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      module: null,
      parameters: [],
      evaluationPhotos: [],
      ...overrides,
    };
  }

  static createHarvestSubprocess(name: string, overrides: Partial<Subprocess> = {}): Subprocess {
    return this.createSubprocess({
      name,
      description: `Harvest subprocess: ${name}`,
      ...overrides,
    });
  }

  // Evaluation Parameter factory methods
  static createEvaluationParameter(overrides: Partial<EvaluationParameter> = {}): EvaluationParameter {
    const id = this.getNextId();
    return {
      id,
      name: `Parameter ${id}`,
      description: `Test parameter ${id}`,
      weight: 10,
      subprocessId: 1,
      isActive: true,
      version: 1,
      effectiveDate: new Date(),
      endDate: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      subprocess: null,
      evaluationDetails: [],
      ...overrides,
    };
  }

  static createParameterWithWeight(weight: number, overrides: Partial<EvaluationParameter> = {}): EvaluationParameter {
    return this.createEvaluationParameter({
      weight,
      ...overrides,
    });
  }

  // Evaluation factory methods
  static createEvaluation(overrides: Partial<Evaluation> = {}): Evaluation {
    const id = this.getNextId();
    return {
      id,
      operatorId: 1,
      evaluatorId: 'test-evaluator-id',
      areaId: 1,
      moduleId: 1,
      quadrantCode: `Q${id}`,
      evaluationDate: new Date(),
      evaluationTime: '10:00',
      workWeek: 1,
      workYear: 2024,
      initialScore: 100.0,
      finalScore: 85.0,
      compliancePercentage: 85.0,
      generalObservations: `Test evaluation ${id}`,
      status: EvaluationStatus.BORRADOR,
      isSynced: false,
      localId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      operator: null,
      evaluator: null,
      area: null,
      module: null,
      details: [],
      photos: [],
      ...overrides,
    };
  }

  static createCompletedEvaluation(overrides: Partial<Evaluation> = {}): Evaluation {
    return this.createEvaluation({
      status: EvaluationStatus.CERRADA,
      finalScore: 90.0,
      compliancePercentage: 90.0,
      isSynced: true,
      ...overrides,
    });
  }

  static createOfflineEvaluation(overrides: Partial<Evaluation> = {}): Evaluation {
    return this.createEvaluation({
      isSynced: false,
      localId: `local-eval-${this.getNextId()}`,
      ...overrides,
    });
  }

  // Evaluation Detail factory methods
  static createEvaluationDetail(overrides: Partial<EvaluationDetail> = {}): EvaluationDetail {
    const id = this.getNextId();
    return {
      id,
      evaluationId: 1,
      parameterId: 1,
      isCompliant: true,
      weightApplied: 10,
      observations: `Test detail ${id}`,
      createdAt: new Date(),
      evaluation: null,
      parameter: null,
      ...overrides,
    };
  }

  static createNonCompliantDetail(overrides: Partial<EvaluationDetail> = {}): EvaluationDetail {
    return this.createEvaluationDetail({
      isCompliant: false,
      observations: 'Does not meet standard',
      ...overrides,
    });
  }

  // Evaluation Photo factory methods
  static createEvaluationPhoto(overrides: Partial<EvaluationPhoto> = {}): EvaluationPhoto {
    const id = this.getNextId();
    return {
      id,
      evaluationId: 1,
      subprocessId: 1,
      fileName: `photo-${id}.jpg`,
      filePath: `storage/photos/photo-${id}.jpg`,
      fileSize: 1024,
      mimeType: 'image/jpeg',
      createdAt: new Date(),
      evaluation: null,
      subprocess: null,
      ...overrides,
    };
  }

  static createPhotoWithSubprocess(subprocessId: number, overrides: Partial<EvaluationPhoto> = {}): EvaluationPhoto {
    return this.createEvaluationPhoto({
      subprocessId,
      ...overrides,
    });
  }

  // Sync Log factory methods
  static createSyncLog(overrides: Partial<SyncLog> = {}): SyncLog {
    const id = this.getNextId();
    return {
      id,
      userId: 'test-user-id',
      operation: 'CREATE',
      entityType: 'evaluation',
      entityId: '1',
      data: { test: 'data' },
      status: 'PENDING',
      attempts: 0,
      lastAttempt: null,
      error: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      ...overrides,
    };
  }

  static createFailedSyncLog(overrides: Partial<SyncLog> = {}): SyncLog {
    return this.createSyncLog({
      status: 'ERROR',
      attempts: 3,
      lastAttempt: new Date(),
      error: 'Sync failed after 3 attempts',
      ...overrides,
    });
  }

  // Complex factory methods for testing scenarios
  static createCompleteEvaluationScenario() {
    const area = this.createArea();
    const module = this.createModule({ areaId: area.id });
    const variety = this.createRoseVariety();
    const operator = this.createOperator({
      areaId: area.id,
      moduleId: module.id,
      roseVarietyId: variety.id,
    });
    const subprocess = this.createSubprocess({ moduleId: module.id });
    const parameter = this.createEvaluationParameter({ subprocessId: subprocess.id });
    
    const evaluation = this.createEvaluation({
      operatorId: operator.id,
      areaId: area.id,
      moduleId: module.id,
    });

    const detail = this.createEvaluationDetail({
      evaluationId: evaluation.id,
      parameterId: parameter.id,
    });

    const photo = this.createEvaluationPhoto({
      evaluationId: evaluation.id,
      subprocessId: subprocess.id,
    });

    return {
      area,
      module,
      variety,
      operator,
      subprocess,
      parameter,
      evaluation,
      detail,
      photo,
    };
  }

  static createMultipleOperatorsScenario(count: number = 5) {
    const area = this.createArea();
    const module = this.createModule({ areaId: area.id });
    const variety = this.createRoseVariety();

    const operators = Array.from({ length: count }, (_, index) => 
      this.createOperator({
        employeeId: `EMP${(index + 1).toString().padStart(3, '0')}`,
        fullName: `Operator ${index + 1}`,
        areaId: area.id,
        moduleId: module.id,
        roseVarietyId: variety.id,
        quadrantCode: `Q${index + 1}`,
      })
    );

    return {
      area,
      module,
      variety,
      operators,
    };
  }

  static createSyncScenario() {
    const user = this.createJefeCalidadUser();
    const evaluation = this.createOfflineEvaluation({
      evaluatorId: user.id,
    });
    const syncLog = this.createSyncLog({
      userId: user.id,
      entityId: evaluation.id.toString(),
      data: evaluation,
    });

    return {
      user,
      evaluation,
      syncLog,
    };
  }

  // Utility methods for test data manipulation
  static createBatch<T>(factory: () => T, count: number): T[] {
    return Array.from({ length: count }, factory);
  }

  static resetCounter(): void {
    this.counter = 1;
  }

  // Mock file factory
  static createMockFile(overrides: Partial<Express.Multer.File> = {}): Express.Multer.File {
    return {
      fieldname: 'file',
      originalname: 'test-image.jpg',
      encoding: '7bit',
      mimetype: 'image/jpeg',
      size: 1024,
      buffer: Buffer.from('test file content'),
      destination: '',
      filename: '',
      path: '',
      stream: null,
      ...overrides,
    };
  }

  // Mock DTO factories
  static createLoginDto(overrides: any = {}) {
    return {
      email: 'test@example.com',
      password: 'password123',
      ...overrides,
    };
  }

  static createRegisterDto(overrides: any = {}) {
    return {
      email: 'newuser@example.com',
      password: 'password123',
      fullName: 'New User',
      role: UserRole.JEFA_CALIDAD,
      ...overrides,
    };
  }

  static createOperatorDto(overrides: any = {}) {
    const id = this.getNextId();
    return {
      employeeId: `EMP${id.toString().padStart(3, '0')}`,
      fullName: `Test Operator ${id}`,
      hireDate: '2023-01-01',
      hasDisability: false,
      moduleId: 1,
      areaId: 1,
      quadrantCode: `Q${id}`,
      roseVarietyId: 1,
      status: OperatorStatus.ACTIVO,
      ...overrides,
    };
  }

  static createEvaluationDto(overrides: any = {}) {
    const id = this.getNextId();
    return {
      operatorId: 1,
      areaId: 1,
      moduleId: 1,
      quadrantCode: `Q${id}`,
      evaluationDate: '2023-12-01',
      evaluationTime: '10:00',
      workWeek: 48,
      workYear: 2023,
      finalScore: 85.0,
      compliancePercentage: 85.0,
      generalObservations: `Test evaluation ${id}`,
      details: [
        {
          parameterId: 1,
          isCompliant: true,
          weightApplied: 10,
          observations: 'Meets standard',
        },
      ],
      ...overrides,
    };
  }
}