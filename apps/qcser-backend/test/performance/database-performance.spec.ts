import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule, getRepositoryToken } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { ConfigModule } from '@nestjs/config';
import { Operator } from '../../src/entities/operator.entity';
import { Evaluation } from '../../src/entities/evaluation.entity';
import { EvaluationDetail } from '../../src/entities/evaluation-detail.entity';
import { User } from '../../src/entities/user.entity';
import { Area } from '../../src/entities/area.entity';
import { Module } from '../../src/entities/module.entity';
import { TestDataFactory } from '../factories/test-data.factory';

describe('Database Performance Testing', () => {
  let dataSource: DataSource;
  let operatorRepository: Repository<Operator>;
  let evaluationRepository: Repository<Evaluation>;
  let evaluationDetailRepository: Repository<EvaluationDetail>;
  let userRepository: Repository<User>;
  let areaRepository: Repository<Area>;
  let moduleRepository: Repository<Module>;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
        }),
        TypeOrmModule.forRootAsync({
          useFactory: () => ({
            type: 'sqlite',
            database: ':memory:',
            autoLoadEntities: true,
            synchronize: true,
            dropSchema: true,
            logging: false, // Disable logging for performance tests
          }),
        }),
        TypeOrmModule.forFeature([
          Operator,
          Evaluation,
          EvaluationDetail,
          User,
          Area,
          Module,
        ]),
      ],
    }).compile();

    dataSource = module.get<DataSource>(DataSource);
    operatorRepository = module.get<Repository<Operator>>(getRepositoryToken(Operator));
    evaluationRepository = module.get<Repository<Evaluation>>(getRepositoryToken(Evaluation));
    evaluationDetailRepository = module.get<Repository<EvaluationDetail>>(getRepositoryToken(EvaluationDetail));
    userRepository = module.get<Repository<User>>(getRepositoryToken(User));
    areaRepository = module.get<Repository<Area>>(getRepositoryToken(Area));
    moduleRepository = module.get<Repository<Module>>(getRepositoryToken(Module));
  });

  afterAll(async () => {
    await dataSource.destroy();
  });

  beforeEach(async () => {
    // Clean database before each test
    await evaluationDetailRepository.clear();
    await evaluationRepository.clear();
    await operatorRepository.clear();
    await userRepository.clear();
    await moduleRepository.clear();
    await areaRepository.clear();
    TestDataFactory.resetCounter();
  });

  describe('Large Dataset Query Performance', () => {
    it('should handle large operator dataset queries efficiently', async () => {
      // Arrange - Create large dataset
      const startTime = Date.now();
      const batchSize = 100;
      const totalOperators = 1000;

      // Create supporting data
      const area = await areaRepository.save(TestDataFactory.createArea());
      const module = await moduleRepository.save(TestDataFactory.createModule({ areaId: area.id }));

      // Create operators in batches
      for (let i = 0; i < totalOperators; i += batchSize) {
        const operators = TestDataFactory.createBatch(
          () => TestDataFactory.createOperator({
            areaId: area.id,
            moduleId: module.id,
          }),
          Math.min(batchSize, totalOperators - i)
        );
        await operatorRepository.save(operators);
      }

      const creationTime = Date.now() - startTime;

      // Act - Test query performance
      const queryStartTime = Date.now();
      const result = await operatorRepository
        .createQueryBuilder('operator')
        .leftJoinAndSelect('operator.area', 'area')
        .leftJoinAndSelect('operator.module', 'module')
        .orderBy('operator.fullName', 'ASC')
        .getMany();
      const queryTime = Date.now() - queryStartTime;

      // Assert
      expect(result).toHaveLength(totalOperators);
      expect(creationTime).toBeLessThan(30000); // Creation within 30 seconds
      expect(queryTime).toBeLessThan(2000); // Query within 2 seconds

      console.log(`Large Dataset Performance Results:
        - Records created: ${totalOperators}
        - Creation time: ${creationTime}ms
        - Query time: ${queryTime}ms
        - Records per second (creation): ${(totalOperators / (creationTime / 1000)).toFixed(2)}
        - Records per second (query): ${(totalOperators / (queryTime / 1000)).toFixed(2)}`);
    });

    it('should handle complex evaluation queries with large datasets', async () => {
      // Arrange - Create evaluation dataset
      const area = await areaRepository.save(TestDataFactory.createArea());
      const module = await moduleRepository.save(TestDataFactory.createModule({ areaId: area.id }));
      const user = await userRepository.save(TestDataFactory.createJefeCalidadUser());

      // Create operators
      const operators = TestDataFactory.createBatch(
        () => TestDataFactory.createOperator({
          areaId: area.id,
          moduleId: module.id,
        }),
        50
      );
      const savedOperators = await operatorRepository.save(operators);

      // Create evaluations for each operator
      const evaluations = savedOperators.flatMap(operator =>
        TestDataFactory.createBatch(
          () => TestDataFactory.createEvaluation({
            operatorId: operator.id,
            evaluatorId: user.id,
            areaId: area.id,
            moduleId: module.id,
          }),
          10 // 10 evaluations per operator = 500 total
        )
      );
      await evaluationRepository.save(evaluations);

      // Act - Test complex query performance
      const startTime = Date.now();
      const result = await evaluationRepository
        .createQueryBuilder('evaluation')
        .leftJoinAndSelect('evaluation.operator', 'operator')
        .leftJoinAndSelect('evaluation.area', 'area')
        .leftJoinAndSelect('evaluation.module', 'module')
        .leftJoinAndSelect('evaluation.evaluator', 'evaluator')
        .where('evaluation.compliancePercentage >= :minCompliance', { minCompliance: 80 })
        .andWhere('evaluation.evaluationDate >= :startDate', { startDate: new Date('2023-01-01') })
        .orderBy('evaluation.evaluationDate', 'DESC')
        .addOrderBy('evaluation.compliancePercentage', 'DESC')
        .getMany();
      const queryTime = Date.now() - startTime;

      // Assert
      expect(result.length).toBeGreaterThan(0);
      expect(queryTime).toBeLessThan(3000); // Complex query within 3 seconds

      console.log(`Complex Evaluation Query Performance:
        - Total evaluations: ${evaluations.length}
        - Filtered results: ${result.length}
        - Query time: ${queryTime}ms
        - Records processed per second: ${(evaluations.length / (queryTime / 1000)).toFixed(2)}`);
    });

    it('should handle aggregation queries efficiently', async () => {
      // Arrange - Create test data
      const area = await areaRepository.save(TestDataFactory.createArea());
      const module = await moduleRepository.save(TestDataFactory.createModule({ areaId: area.id }));
      const user = await userRepository.save(TestDataFactory.createJefeCalidadUser());

      const operators = TestDataFactory.createBatch(
        () => TestDataFactory.createOperator({
          areaId: area.id,
          moduleId: module.id,
        }),
        100
      );
      const savedOperators = await operatorRepository.save(operators);

      const evaluations = savedOperators.flatMap(operator =>
        TestDataFactory.createBatch(
          () => TestDataFactory.createEvaluation({
            operatorId: operator.id,
            evaluatorId: user.id,
            areaId: area.id,
            moduleId: module.id,
            compliancePercentage: Math.random() * 100,
          }),
          5
        )
      );
      await evaluationRepository.save(evaluations);

      // Act - Test aggregation performance
      const startTime = Date.now();
      const aggregationResult = await evaluationRepository
        .createQueryBuilder('evaluation')
        .select('AVG(evaluation.compliancePercentage)', 'avgCompliance')
        .addSelect('COUNT(evaluation.id)', 'totalEvaluations')
        .addSelect('MIN(evaluation.compliancePercentage)', 'minCompliance')
        .addSelect('MAX(evaluation.compliancePercentage)', 'maxCompliance')
        .addSelect('evaluation.areaId', 'areaId')
        .groupBy('evaluation.areaId')
        .getRawMany();
      const aggregationTime = Date.now() - startTime;

      // Test grouping performance
      const groupingStartTime = Date.now();
      const groupingResult = await evaluationRepository
        .createQueryBuilder('evaluation')
        .leftJoin('evaluation.operator', 'operator')
        .select('operator.id', 'operatorId')
        .addSelect('operator.fullName', 'operatorName')
        .addSelect('COUNT(evaluation.id)', 'evaluationCount')
        .addSelect('AVG(evaluation.compliancePercentage)', 'avgCompliance')
        .groupBy('operator.id')
        .addGroupBy('operator.fullName')
        .having('COUNT(evaluation.id) > :minEvaluations', { minEvaluations: 3 })
        .orderBy('AVG(evaluation.compliancePercentage)', 'DESC')
        .getRawMany();
      const groupingTime = Date.now() - groupingStartTime;

      // Assert
      expect(aggregationResult).toHaveLength(1); // One area
      expect(groupingResult.length).toBeGreaterThan(0);
      expect(aggregationTime).toBeLessThan(1000); // Aggregation within 1 second
      expect(groupingTime).toBeLessThan(2000); // Grouping within 2 seconds

      console.log(`Aggregation Query Performance:
        - Total evaluations: ${evaluations.length}
        - Aggregation time: ${aggregationTime}ms
        - Grouping time: ${groupingTime}ms
        - Grouped results: ${groupingResult.length}`);
    });
  });

  describe('Index Performance Testing', () => {
    it('should demonstrate index effectiveness on frequently queried columns', async () => {
      // Arrange - Create large dataset
      const area = await areaRepository.save(TestDataFactory.createArea());
      const module = await moduleRepository.save(TestDataFactory.createModule({ areaId: area.id }));
      const user = await userRepository.save(TestDataFactory.createJefeCalidadUser());

      const operators = TestDataFactory.createBatch(
        () => TestDataFactory.createOperator({
          areaId: area.id,
          moduleId: module.id,
        }),
        200
      );
      await operatorRepository.save(operators);

      // Test query performance on indexed columns
      const indexedQueryStartTime = Date.now();
      const indexedResult = await operatorRepository.find({
        where: { status: 'ACTIVO' }, // Assuming status is indexed
        relations: ['area', 'module'],
      });
      const indexedQueryTime = Date.now() - indexedQueryStartTime;

      // Test query performance on non-indexed columns
      const nonIndexedQueryStartTime = Date.now();
      const nonIndexedResult = await operatorRepository
        .createQueryBuilder('operator')
        .where('operator.fullName LIKE :name', { name: '%Operator%' })
        .getMany();
      const nonIndexedQueryTime = Date.now() - nonIndexedQueryStartTime;

      // Assert
      expect(indexedResult.length).toBeGreaterThan(0);
      expect(nonIndexedResult.length).toBeGreaterThan(0);
      expect(indexedQueryTime).toBeLessThan(500); // Indexed query should be fast
      expect(nonIndexedQueryTime).toBeLessThan(1000); // Non-indexed query may be slower

      console.log(`Index Performance Comparison:
        - Indexed query time: ${indexedQueryTime}ms (${indexedResult.length} results)
        - Non-indexed query time: ${nonIndexedQueryTime}ms (${nonIndexedResult.length} results)
        - Performance ratio: ${(nonIndexedQueryTime / indexedQueryTime).toFixed(2)}x`);
    });

    it('should test composite index performance', async () => {
      // Arrange - Create evaluation data
      const area = await areaRepository.save(TestDataFactory.createArea());
      const module = await moduleRepository.save(TestDataFactory.createModule({ areaId: area.id }));
      const user = await userRepository.save(TestDataFactory.createJefeCalidadUser());

      const operators = TestDataFactory.createBatch(
        () => TestDataFactory.createOperator({
          areaId: area.id,
          moduleId: module.id,
        }),
        50
      );
      const savedOperators = await operatorRepository.save(operators);

      const evaluations = savedOperators.flatMap(operator =>
        Array.from({ length: 20 }, (_, weekIndex) =>
          TestDataFactory.createEvaluation({
            operatorId: operator.id,
            evaluatorId: user.id,
            areaId: area.id,
            moduleId: module.id,
            workWeek: weekIndex + 1,
            workYear: 2023,
          })
        )
      );
      await evaluationRepository.save(evaluations);

      // Test composite index query (operator + week + year)
      const compositeQueryStartTime = Date.now();
      const compositeResult = await evaluationRepository.find({
        where: {
          operatorId: savedOperators[0].id,
          workWeek: 10,
          workYear: 2023,
        },
      });
      const compositeQueryTime = Date.now() - compositeQueryStartTime;

      // Test range query performance
      const rangeQueryStartTime = Date.now();
      const rangeResult = await evaluationRepository
        .createQueryBuilder('evaluation')
        .where('evaluation.workWeek BETWEEN :startWeek AND :endWeek', {
          startWeek: 5,
          endWeek: 15,
        })
        .andWhere('evaluation.workYear = :year', { year: 2023 })
        .getMany();
      const rangeQueryTime = Date.now() - rangeQueryStartTime;

      // Assert
      expect(compositeResult.length).toBeGreaterThan(0);
      expect(rangeResult.length).toBeGreaterThan(0);
      expect(compositeQueryTime).toBeLessThan(100); // Composite index should be very fast
      expect(rangeQueryTime).toBeLessThan(500); // Range query should be reasonably fast

      console.log(`Composite Index Performance:
        - Total evaluations: ${evaluations.length}
        - Composite query time: ${compositeQueryTime}ms (${compositeResult.length} results)
        - Range query time: ${rangeQueryTime}ms (${rangeResult.length} results)`);
    });
  });

  describe('Transaction Performance Testing', () => {
    it('should handle bulk operations within transactions efficiently', async () => {
      // Arrange
      const area = await areaRepository.save(TestDataFactory.createArea());
      const module = await moduleRepository.save(TestDataFactory.createModule({ areaId: area.id }));

      const batchSize = 100;
      const totalOperators = 500;

      // Act - Test transaction performance
      const transactionStartTime = Date.now();
      await dataSource.transaction(async manager => {
        for (let i = 0; i < totalOperators; i += batchSize) {
          const operators = TestDataFactory.createBatch(
            () => TestDataFactory.createOperator({
              areaId: area.id,
              moduleId: module.id,
            }),
            Math.min(batchSize, totalOperators - i)
          );
          await manager.save(Operator, operators);
        }
      });
      const transactionTime = Date.now() - transactionStartTime;

      // Verify results
      const count = await operatorRepository.count();

      // Assert
      expect(count).toBe(totalOperators);
      expect(transactionTime).toBeLessThan(10000); // Transaction within 10 seconds

      console.log(`Transaction Performance:
        - Records created: ${totalOperators}
        - Transaction time: ${transactionTime}ms
        - Records per second: ${(totalOperators / (transactionTime / 1000)).toFixed(2)}`);
    });

    it('should handle concurrent transactions without deadlocks', async () => {
      // Arrange
      const area = await areaRepository.save(TestDataFactory.createArea());
      const module = await moduleRepository.save(TestDataFactory.createModule({ areaId: area.id }));

      const concurrentTransactions = 5;
      const recordsPerTransaction = 20;

      // Act - Test concurrent transactions
      const startTime = Date.now();
      const promises = Array.from({ length: concurrentTransactions }, async (_, index) => {
        return dataSource.transaction(async manager => {
          const operators = TestDataFactory.createBatch(
            () => TestDataFactory.createOperator({
              areaId: area.id,
              moduleId: module.id,
              employeeId: `CONC${index}_${TestDataFactory['getNextId']()}`,
            }),
            recordsPerTransaction
          );
          return manager.save(Operator, operators);
        });
      });

      const results = await Promise.all(promises);
      const concurrentTime = Date.now() - startTime;

      // Verify results
      const totalCount = await operatorRepository.count();

      // Assert
      expect(results).toHaveLength(concurrentTransactions);
      expect(totalCount).toBe(concurrentTransactions * recordsPerTransaction);
      expect(concurrentTime).toBeLessThan(5000); // Concurrent transactions within 5 seconds

      console.log(`Concurrent Transaction Performance:
        - Concurrent transactions: ${concurrentTransactions}
        - Records per transaction: ${recordsPerTransaction}
        - Total records: ${totalCount}
        - Total time: ${concurrentTime}ms`);
    });
  });

  describe('Memory Usage and Connection Pool Testing', () => {
    it('should handle large result sets without memory issues', async () => {
      // Arrange
      const area = await areaRepository.save(TestDataFactory.createArea());
      const module = await moduleRepository.save(TestDataFactory.createModule({ areaId: area.id }));

      const largeDatasetSize = 2000;
      const operators = TestDataFactory.createBatch(
        () => TestDataFactory.createOperator({
          areaId: area.id,
          moduleId: module.id,
        }),
        largeDatasetSize
      );
      await operatorRepository.save(operators);

      // Monitor memory usage
      const initialMemory = process.memoryUsage();

      // Act - Query large dataset
      const startTime = Date.now();
      const result = await operatorRepository
        .createQueryBuilder('operator')
        .leftJoinAndSelect('operator.area', 'area')
        .leftJoinAndSelect('operator.module', 'module')
        .getMany();
      const queryTime = Date.now() - startTime;

      const finalMemory = process.memoryUsage();
      const memoryIncrease = finalMemory.heapUsed - initialMemory.heapUsed;

      // Assert
      expect(result).toHaveLength(largeDatasetSize);
      expect(queryTime).toBeLessThan(3000); // Query within 3 seconds
      expect(memoryIncrease).toBeLessThan(100 * 1024 * 1024); // Less than 100MB increase

      console.log(`Large Result Set Performance:
        - Records queried: ${largeDatasetSize}
        - Query time: ${queryTime}ms
        - Memory increase: ${(memoryIncrease / 1024 / 1024).toFixed(2)} MB
        - Records per MB: ${(largeDatasetSize / (memoryIncrease / 1024 / 1024)).toFixed(2)}`);
    });

    it('should handle streaming queries for very large datasets', async () => {
      // Arrange
      const area = await areaRepository.save(TestDataFactory.createArea());
      const module = await moduleRepository.save(TestDataFactory.createModule({ areaId: area.id }));

      const veryLargeDatasetSize = 5000;
      const batchSize = 500;

      // Create very large dataset in batches
      for (let i = 0; i < veryLargeDatasetSize; i += batchSize) {
        const operators = TestDataFactory.createBatch(
          () => TestDataFactory.createOperator({
            areaId: area.id,
            moduleId: module.id,
          }),
          Math.min(batchSize, veryLargeDatasetSize - i)
        );
        await operatorRepository.save(operators);
      }

      // Act - Test streaming query
      const startTime = Date.now();
      let processedCount = 0;
      const initialMemory = process.memoryUsage();

      const stream = await operatorRepository
        .createQueryBuilder('operator')
        .stream();

      await new Promise<void>((resolve, reject) => {
        stream.on('data', (row) => {
          processedCount++;
          // Simulate processing
        });

        stream.on('end', () => {
          resolve();
        });

        stream.on('error', (error) => {
          reject(error);
        });
      });

      const streamTime = Date.now() - startTime;
      const finalMemory = process.memoryUsage();
      const memoryIncrease = finalMemory.heapUsed - initialMemory.heapUsed;

      // Assert
      expect(processedCount).toBe(veryLargeDatasetSize);
      expect(streamTime).toBeLessThan(10000); // Streaming within 10 seconds
      expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024); // Less than 50MB increase (streaming should use less memory)

      console.log(`Streaming Query Performance:
        - Records streamed: ${processedCount}
        - Streaming time: ${streamTime}ms
        - Memory increase: ${(memoryIncrease / 1024 / 1024).toFixed(2)} MB
        - Records per second: ${(processedCount / (streamTime / 1000)).toFixed(2)}`);
    });
  });

  describe('Query Optimization Testing', () => {
    it('should demonstrate N+1 query problem and solution', async () => {
      // Arrange
      const area = await areaRepository.save(TestDataFactory.createArea());
      const module = await moduleRepository.save(TestDataFactory.createModule({ areaId: area.id }));
      const user = await userRepository.save(TestDataFactory.createJefeCalidadUser());

      const operators = TestDataFactory.createBatch(
        () => TestDataFactory.createOperator({
          areaId: area.id,
          moduleId: module.id,
        }),
        50
      );
      const savedOperators = await operatorRepository.save(operators);

      const evaluations = savedOperators.flatMap(operator =>
        TestDataFactory.createBatch(
          () => TestDataFactory.createEvaluation({
            operatorId: operator.id,
            evaluatorId: user.id,
            areaId: area.id,
            moduleId: module.id,
          }),
          3
        )
      );
      await evaluationRepository.save(evaluations);

      // Act - Test N+1 problem (bad approach)
      const n1StartTime = Date.now();
      const operatorsWithoutJoin = await operatorRepository.find();
      for (const operator of operatorsWithoutJoin) {
        // This would cause N+1 queries in real scenario
        await evaluationRepository.find({
          where: { operatorId: operator.id },
        });
      }
      const n1Time = Date.now() - n1StartTime;

      // Act - Test optimized approach (good approach)
      const optimizedStartTime = Date.now();
      const operatorsWithJoin = await operatorRepository
        .createQueryBuilder('operator')
        .leftJoinAndSelect('operator.evaluations', 'evaluations')
        .getMany();
      const optimizedTime = Date.now() - optimizedStartTime;

      // Assert
      expect(operatorsWithoutJoin).toHaveLength(50);
      expect(operatorsWithJoin).toHaveLength(50);
      expect(optimizedTime).toBeLessThan(n1Time); // Optimized should be faster
      expect(optimizedTime).toBeLessThan(1000); // Optimized query within 1 second

      console.log(`N+1 Query Problem Demonstration:
        - N+1 approach time: ${n1Time}ms
        - Optimized approach time: ${optimizedTime}ms
        - Performance improvement: ${(n1Time / optimizedTime).toFixed(2)}x faster`);
    });

    it('should test query plan optimization with different WHERE clauses', async () => {
      // Arrange
      const area = await areaRepository.save(TestDataFactory.createArea());
      const module = await moduleRepository.save(TestDataFactory.createModule({ areaId: area.id }));

      const operators = TestDataFactory.createBatch(
        () => TestDataFactory.createOperator({
          areaId: area.id,
          moduleId: module.id,
        }),
        1000
      );
      await operatorRepository.save(operators);

      // Test different query patterns
      const queries = [
        {
          name: 'Simple equality',
          query: () => operatorRepository.find({ where: { status: 'ACTIVO' } }),
        },
        {
          name: 'LIKE pattern',
          query: () => operatorRepository
            .createQueryBuilder('operator')
            .where('operator.fullName LIKE :pattern', { pattern: '%Operator%' })
            .getMany(),
        },
        {
          name: 'Range query',
          query: () => operatorRepository
            .createQueryBuilder('operator')
            .where('operator.hireDate >= :startDate', { startDate: new Date('2023-01-01') })
            .getMany(),
        },
        {
          name: 'Complex conditions',
          query: () => operatorRepository
            .createQueryBuilder('operator')
            .where('operator.status = :status', { status: 'ACTIVO' })
            .andWhere('operator.hasDisability = :hasDisability', { hasDisability: false })
            .andWhere('operator.areaId = :areaId', { areaId: area.id })
            .getMany(),
        },
      ];

      // Act & Assert
      for (const { name, query } of queries) {
        const startTime = Date.now();
        const result = await query();
        const queryTime = Date.now() - startTime;

        expect(result.length).toBeGreaterThan(0);
        expect(queryTime).toBeLessThan(2000); // Each query within 2 seconds

        console.log(`Query Performance - ${name}:
          - Results: ${result.length}
          - Time: ${queryTime}ms
          - Records per second: ${(result.length / (queryTime / 1000)).toFixed(2)}`);
      }
    });
  });
});