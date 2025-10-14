import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import * as request from 'supertest';
import { OperatorsModule } from '../src/modules/operators/operators.module';
import { AuthModule } from '../src/modules/auth/auth.module';
import { Operator, OperatorStatus } from '../src/entities/operator.entity';
import { User, UserRole } from '../src/entities/user.entity';
import { Area } from '../src/entities/area.entity';
import { Module } from '../src/entities/module.entity';
import { RoseVariety } from '../src/entities/rose-variety.entity';
import databaseConfig from '../src/config/database.config';
import jwtConfig from '../src/config/jwt.config';

describe('OperatorsController (e2e)', () => {
  let app: INestApplication;
  let authToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          load: [databaseConfig, jwtConfig],
        }),
        TypeOrmModule.forRootAsync({
          useFactory: () => ({
            type: 'sqlite',
            database: ':memory:',
            entities: [Operator, User, Area, Module, RoseVariety],
            synchronize: true,
            dropSchema: true,
          }),
        }),
        AuthModule,
        OperatorsModule,
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    // Create test user and get auth token
    const testUser = {
      email: 'admin@qcser.com',
      password: 'TestPassword123!',
      fullName: 'Admin User',
      role: UserRole.ADMINISTRADOR,
    };

    await request(app.getHttpServer())
      .post('/auth/register')
      .send(testUser);

    const loginResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: testUser.email,
        password: testUser.password,
      });

    authToken = loginResponse.body.access_token;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Operator CRUD Operations (ADM-06 to ADM-09)', () => {
    const testOperator = {
      employeeId: 'EMP001',
      fullName: 'Juan Pérez',
      hireDate: '2023-01-15',
      hasDisability: false,
      moduleId: 1,
      areaId: 1,
      quadrantCode: 'A1',
      roseVarietyId: 1,
      status: OperatorStatus.ACTIVO,
    };

    let operatorId: number;

    it('should create a new operator (ADM-06)', () => {
      return request(app.getHttpServer())
        .post('/operators')
        .set('Authorization', `Bearer ${authToken}`)
        .send(testOperator)
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('id');
          expect(res.body).toHaveProperty('employeeId', testOperator.employeeId);
          expect(res.body).toHaveProperty('fullName', testOperator.fullName);
          expect(res.body).toHaveProperty('hireDate');
          expect(res.body).toHaveProperty('hasDisability', testOperator.hasDisability);
          expect(res.body).toHaveProperty('quadrantCode', testOperator.quadrantCode);
          expect(res.body).toHaveProperty('status', testOperator.status);
          operatorId = res.body.id;
        });
    });

    it('should store all required operator information (ADM-06)', () => {
      return request(app.getHttpServer())
        .get(`/operators/${operatorId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('employeeId', testOperator.employeeId);
          expect(res.body).toHaveProperty('fullName', testOperator.fullName);
          expect(res.body).toHaveProperty('hireDate');
          expect(res.body).toHaveProperty('hasDisability', testOperator.hasDisability);
          expect(res.body).toHaveProperty('moduleId', testOperator.moduleId);
          expect(res.body).toHaveProperty('areaId', testOperator.areaId);
          expect(res.body).toHaveProperty('quadrantCode', testOperator.quadrantCode);
          expect(res.body).toHaveProperty('roseVarietyId', testOperator.roseVarietyId);
          expect(res.body).toHaveProperty('status', testOperator.status);
        });
    });

    it('should list operators with personal information (ADM-07)', () => {
      return request(app.getHttpServer())
        .get('/operators')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
          expect(res.body.length).toBeGreaterThan(0);
          
          const operator = res.body[0];
          expect(operator).toHaveProperty('fullName');
          expect(operator).toHaveProperty('moduleId');
          expect(operator).toHaveProperty('areaId');
          expect(operator).toHaveProperty('quadrantCode');
        });
    });

    it('should update operator data (ADM-08)', () => {
      const updateData = {
        fullName: 'Juan Carlos Pérez',
        quadrantCode: 'A2',
        hasDisability: true,
        disabilityDescription: 'Visual impairment',
      };

      return request(app.getHttpServer())
        .patch(`/operators/${operatorId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('fullName', updateData.fullName);
          expect(res.body).toHaveProperty('quadrantCode', updateData.quadrantCode);
          expect(res.body).toHaveProperty('hasDisability', updateData.hasDisability);
          expect(res.body).toHaveProperty('disabilityDescription', updateData.disabilityDescription);
        });
    });

    it('should support operator status management (ADM-20)', async () => {
      // Test status update to INACTIVO
      await request(app.getHttpServer())
        .patch(`/operators/${operatorId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ status: OperatorStatus.INACTIVO })
        .expect(200)
        .expect((res) => {
          expect(res.body.status).toBe(OperatorStatus.INACTIVO);
        });

      // Test status update to BAJA
      await request(app.getHttpServer())
        .patch(`/operators/${operatorId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ status: OperatorStatus.BAJA })
        .expect(200)
        .expect((res) => {
          expect(res.body.status).toBe(OperatorStatus.BAJA);
        });

      // Reactivate for further tests
      await request(app.getHttpServer())
        .patch(`/operators/${operatorId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ status: OperatorStatus.ACTIVO })
        .expect(200);
    });

    it('should delete inactive operators (ADM-09)', async () => {
      // First set operator to inactive
      await request(app.getHttpServer())
        .patch(`/operators/${operatorId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ status: OperatorStatus.BAJA })
        .expect(200);

      // Then delete the operator
      await request(app.getHttpServer())
        .delete(`/operators/${operatorId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      // Verify operator is deleted
      await request(app.getHttpServer())
        .get(`/operators/${operatorId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });

    it('should prevent deletion of active operators', async () => {
      // Create a new active operator
      const activeOperator = {
        ...testOperator,
        employeeId: 'EMP002',
        status: OperatorStatus.ACTIVO,
      };

      const createResponse = await request(app.getHttpServer())
        .post('/operators')
        .set('Authorization', `Bearer ${authToken}`)
        .send(activeOperator)
        .expect(201);

      const activeOperatorId = createResponse.body.id;

      // Try to delete active operator - should fail
      await request(app.getHttpServer())
        .delete(`/operators/${activeOperatorId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400)
        .expect((res) => {
          expect(res.body.message).toContain('Cannot delete active operator');
        });
    });
  });

  describe('Operator Search and Filtering (ADM-07)', () => {
    beforeAll(async () => {
      // Create test operators for filtering
      const operators = [
        {
          employeeId: 'EMP003',
          fullName: 'María García',
          hireDate: '2023-02-01',
          hasDisability: false,
          moduleId: 1,
          areaId: 1,
          quadrantCode: 'B1',
          roseVarietyId: 1,
          status: OperatorStatus.ACTIVO,
        },
        {
          employeeId: 'EMP004',
          fullName: 'Carlos López',
          hireDate: '2023-03-01',
          hasDisability: true,
          moduleId: 2,
          areaId: 2,
          quadrantCode: 'C1',
          roseVarietyId: 2,
          status: OperatorStatus.INACTIVO,
        },
      ];

      for (const operator of operators) {
        await request(app.getHttpServer())
          .post('/operators')
          .set('Authorization', `Bearer ${authToken}`)
          .send(operator)
          .expect(201);
      }
    });

    it('should filter operators by module', () => {
      return request(app.getHttpServer())
        .get('/operators?moduleId=1')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
          res.body.forEach(operator => {
            expect(operator.moduleId).toBe(1);
          });
        });
    });

    it('should filter operators by area', () => {
      return request(app.getHttpServer())
        .get('/operators?areaId=2')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
          res.body.forEach(operator => {
            expect(operator.areaId).toBe(2);
          });
        });
    });

    it('should filter operators by status', () => {
      return request(app.getHttpServer())
        .get(`/operators?status=${OperatorStatus.ACTIVO}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
          res.body.forEach(operator => {
            expect(operator.status).toBe(OperatorStatus.ACTIVO);
          });
        });
    });

    it('should search operators by name', () => {
      return request(app.getHttpServer())
        .get('/operators/search?q=María')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
          expect(res.body.length).toBeGreaterThan(0);
          expect(res.body[0].fullName).toContain('María');
        });
    });

    it('should search operators by employee ID', () => {
      return request(app.getHttpServer())
        .get('/operators/search?q=EMP003')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
          expect(res.body.length).toBeGreaterThan(0);
          expect(res.body[0].employeeId).toBe('EMP003');
        });
    });

    it('should combine multiple filters', () => {
      return request(app.getHttpServer())
        .get(`/operators?moduleId=1&status=${OperatorStatus.ACTIVO}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
          res.body.forEach(operator => {
            expect(operator.moduleId).toBe(1);
            expect(operator.status).toBe(OperatorStatus.ACTIVO);
          });
        });
    });
  });

  describe('Operator Statistics', () => {
    it('should return operator statistics', () => {
      return request(app.getHttpServer())
        .get('/operators/statistics')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('total');
          expect(res.body).toHaveProperty('active');
          expect(res.body).toHaveProperty('inactive');
          expect(res.body).toHaveProperty('terminated');
          expect(res.body).toHaveProperty('byModule');
          expect(res.body).toHaveProperty('byArea');
          
          expect(typeof res.body.total).toBe('number');
          expect(typeof res.body.active).toBe('number');
          expect(typeof res.body.inactive).toBe('number');
          expect(typeof res.body.terminated).toBe('number');
          expect(Array.isArray(res.body.byModule)).toBe(true);
          expect(Array.isArray(res.body.byArea)).toBe(true);
        });
    });

    it('should provide statistics breakdown by module', () => {
      return request(app.getHttpServer())
        .get('/operators/statistics')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.byModule).toBeDefined();
          if (res.body.byModule.length > 0) {
            const moduleStats = res.body.byModule[0];
            expect(moduleStats).toHaveProperty('moduleId');
            expect(moduleStats).toHaveProperty('moduleName');
            expect(moduleStats).toHaveProperty('count');
          }
        });
    });
  });

  describe('Duplicate Prevention (ADM-14, ADM-21)', () => {
    it('should prevent duplicate employee IDs', async () => {
      const duplicateOperator = {
        employeeId: 'EMP003', // Already exists
        fullName: 'Duplicate Employee',
        hireDate: '2023-04-01',
        hasDisability: false,
        moduleId: 1,
        areaId: 1,
        quadrantCode: 'D1',
        roseVarietyId: 1,
        status: OperatorStatus.ACTIVO,
      };

      await request(app.getHttpServer())
        .post('/operators')
        .set('Authorization', `Bearer ${authToken}`)
        .send(duplicateOperator)
        .expect(409)
        .expect((res) => {
          expect(res.body.message).toContain('already exists');
        });
    });

    it('should allow updating operator without changing employee ID', async () => {
      // Get an existing operator
      const operatorsResponse = await request(app.getHttpServer())
        .get('/operators')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      const existingOperator = operatorsResponse.body[0];

      // Update without changing employee ID
      await request(app.getHttpServer())
        .patch(`/operators/${existingOperator.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ fullName: 'Updated Name' })
        .expect(200)
        .expect((res) => {
          expect(res.body.fullName).toBe('Updated Name');
          expect(res.body.employeeId).toBe(existingOperator.employeeId);
        });
    });

    it('should prevent updating to existing employee ID', async () => {
      // Get two different operators
      const operatorsResponse = await request(app.getHttpServer())
        .get('/operators')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      if (operatorsResponse.body.length >= 2) {
        const operator1 = operatorsResponse.body[0];
        const operator2 = operatorsResponse.body[1];

        // Try to update operator1 with operator2's employee ID
        await request(app.getHttpServer())
          .patch(`/operators/${operator1.id}`)
          .set('Authorization', `Bearer ${authToken}`)
          .send({ employeeId: operator2.employeeId })
          .expect(409)
          .expect((res) => {
            expect(res.body.message).toContain('already exists');
          });
      }
    });
  });

  describe('Confirmation Messages (ADM-16)', () => {
    it('should show confirmation when adding operator', () => {
      const newOperator = {
        employeeId: 'EMP005',
        fullName: 'Ana Rodríguez',
        hireDate: '2023-05-01',
        hasDisability: false,
        moduleId: 1,
        areaId: 1,
        quadrantCode: 'E1',
        roseVarietyId: 1,
        status: OperatorStatus.ACTIVO,
      };

      return request(app.getHttpServer())
        .post('/operators')
        .set('Authorization', `Bearer ${authToken}`)
        .send(newOperator)
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('message');
          expect(res.body.message).toContain('created successfully');
        });
    });

    it('should show confirmation when updating operator', async () => {
      const operatorsResponse = await request(app.getHttpServer())
        .get('/operators')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      const operator = operatorsResponse.body[0];

      await request(app.getHttpServer())
        .patch(`/operators/${operator.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ fullName: 'Updated Name Again' })
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('message');
          expect(res.body.message).toContain('updated successfully');
        });
    });
  });

  describe('Access Control and Authorization', () => {
    let jefeToken: string;
    let gerenteToken: string;

    beforeAll(async () => {
      // Create users with different roles
      const jefeUser = {
        email: 'jefe@qcser.com',
        password: 'TestPassword123!',
        fullName: 'Jefe de Calidad',
        role: UserRole.JEFA_CALIDAD,
      };

      const gerenteUser = {
        email: 'gerente@qcser.com',
        password: 'TestPassword123!',
        fullName: 'Gerente General',
        role: UserRole.GERENTE_GENERAL,
      };

      await request(app.getHttpServer())
        .post('/auth/register')
        .send(jefeUser);

      await request(app.getHttpServer())
        .post('/auth/register')
        .send(gerenteUser);

      const jefeResponse = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: jefeUser.email, password: jefeUser.password });

      const gerenteResponse = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: gerenteUser.email, password: gerenteUser.password });

      jefeToken = jefeResponse.body.access_token;
      gerenteToken = gerenteResponse.body.access_token;
    });

    it('should allow administrators to manage operators', () => {
      const newOperator = {
        employeeId: 'EMP006',
        fullName: 'Admin Created Operator',
        hireDate: '2023-06-01',
        hasDisability: false,
        moduleId: 1,
        areaId: 1,
        quadrantCode: 'F1',
        roseVarietyId: 1,
        status: OperatorStatus.ACTIVO,
      };

      return request(app.getHttpServer())
        .post('/operators')
        .set('Authorization', `Bearer ${authToken}`)
        .send(newOperator)
        .expect(201);
    });

    it('should allow read access for other roles', async () => {
      // Jefe de Calidad should be able to read operators
      await request(app.getHttpServer())
        .get('/operators')
        .set('Authorization', `Bearer ${jefeToken}`)
        .expect(200);

      // Gerente General should be able to read operators
      await request(app.getHttpServer())
        .get('/operators')
        .set('Authorization', `Bearer ${gerenteToken}`)
        .expect(200);
    });

    it('should restrict write access for non-admin roles', async () => {
      const newOperator = {
        employeeId: 'EMP007',
        fullName: 'Unauthorized Operator',
        hireDate: '2023-07-01',
        hasDisability: false,
        moduleId: 1,
        areaId: 1,
        quadrantCode: 'G1',
        roseVarietyId: 1,
        status: OperatorStatus.ACTIVO,
      };

      // Jefe de Calidad should not be able to create operators
      await request(app.getHttpServer())
        .post('/operators')
        .set('Authorization', `Bearer ${jefeToken}`)
        .send(newOperator)
        .expect(403);

      // Gerente General should not be able to create operators
      await request(app.getHttpServer())
        .post('/operators')
        .set('Authorization', `Bearer ${gerenteToken}`)
        .send(newOperator)
        .expect(403);
    });
  });

  describe('Error Handling and Validation', () => {
    it('should return 401 for unauthenticated requests', () => {
      return request(app.getHttpServer())
        .get('/operators')
        .expect(401);
    });

    it('should return 404 for non-existent operator', () => {
      return request(app.getHttpServer())
        .get('/operators/999999')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });

    it('should validate required fields', () => {
      const invalidOperator = {
        // Missing required fields
        fullName: 'Incomplete Operator',
      };

      return request(app.getHttpServer())
        .post('/operators')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidOperator)
        .expect(400)
        .expect((res) => {
          expect(res.body).toHaveProperty('message');
          expect(Array.isArray(res.body.message)).toBe(true);
        });
    });

    it('should validate data types', () => {
      const invalidOperator = {
        employeeId: 'EMP008',
        fullName: 'Type Test Operator',
        hireDate: 'invalid-date',
        hasDisability: 'not-boolean',
        moduleId: 'not-number',
        areaId: 'not-number',
        quadrantCode: 'H1',
        roseVarietyId: 'not-number',
        status: 'INVALID_STATUS',
      };

      return request(app.getHttpServer())
        .post('/operators')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidOperator)
        .expect(400);
    });

    it('should handle database constraint violations', async () => {
      // This would test foreign key constraints, etc.
      const operatorWithInvalidReferences = {
        employeeId: 'EMP009',
        fullName: 'Invalid References Operator',
        hireDate: '2023-08-01',
        hasDisability: false,
        moduleId: 999999, // Non-existent module
        areaId: 999999, // Non-existent area
        quadrantCode: 'I1',
        roseVarietyId: 999999, // Non-existent variety
        status: OperatorStatus.ACTIVO,
      };

      await request(app.getHttpServer())
        .post('/operators')
        .set('Authorization', `Bearer ${authToken}`)
        .send(operatorWithInvalidReferences)
        .expect(400);
    });
  });
});