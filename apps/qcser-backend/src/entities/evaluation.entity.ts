import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
  Unique,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { Operator } from './operator.entity';
import { User } from './user.entity';
import { Area } from './area.entity';
import { Module } from './module.entity';
import { EvaluationDetail } from './evaluation-detail.entity';
import { EvaluationPhoto } from './evaluation-photo.entity';

export enum EvaluationStatus {
  BORRADOR = 'borrador',
  CERRADA = 'cerrada',
}

@Entity('evaluations')
@Unique(['operatorId', 'quadrantCode', 'workWeek', 'workYear'])
export class Evaluation {
  @ApiProperty({ description: 'ID de la evaluación' })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({ description: 'ID del operario evaluado' })
  @Column({ name: 'operator_id' })
  operatorId: number;

  @ApiProperty({ description: 'ID del evaluador' })
  @Column({ name: 'evaluator_id' })
  evaluatorId: string;

  @ApiProperty({ description: 'ID del área' })
  @Column({ name: 'area_id' })
  areaId: number;

  @ApiProperty({ description: 'Código del cuadrante' })
  @Column({ name: 'quadrant_code', length: 20 })
  quadrantCode: string;

  @ApiProperty({ description: 'ID del módulo' })
  @Column({ name: 'module_id' })
  moduleId: number;

  @ApiProperty({ description: 'Fecha de evaluación' })
  @Column({ name: 'evaluation_date', type: 'date' })
  evaluationDate: Date;

  @ApiProperty({ description: 'Hora de evaluación' })
  @Column({ name: 'evaluation_time', type: 'time' })
  evaluationTime: string;

  @ApiProperty({ description: 'Semana de trabajo' })
  @Column({ name: 'work_week' })
  workWeek: number;

  @ApiProperty({ description: 'Año de trabajo' })
  @Column({ name: 'work_year' })
  workYear: number;

  @ApiProperty({ description: 'Puntaje inicial' })
  @Column({ name: 'initial_score', type: 'decimal', precision: 5, scale: 2, default: 100.00 })
  initialScore: number;

  @ApiProperty({ description: 'Puntaje final' })
  @Column({ name: 'final_score', type: 'decimal', precision: 5, scale: 2 })
  finalScore: number;

  @ApiProperty({ description: 'Porcentaje de cumplimiento' })
  @Column({ name: 'compliance_percentage', type: 'decimal', precision: 5, scale: 2 })
  compliancePercentage: number;

  @ApiProperty({ description: 'Observaciones generales' })
  @Column({ name: 'general_observations', type: 'text', nullable: true })
  generalObservations: string;

  @ApiProperty({ description: 'Estado de la evaluación', enum: EvaluationStatus })
  @Column({
    type: 'enum',
    enum: EvaluationStatus,
    default: EvaluationStatus.BORRADOR,
  })
  status: EvaluationStatus;

  @ApiProperty({ description: 'Estado de sincronización' })
  @Column({ name: 'is_synced', default: false })
  isSynced: boolean;

  @ApiProperty({ description: 'ID local para sincronización offline' })
  @Column({ name: 'local_id', type: 'uuid', nullable: true })
  localId: string;

  @ApiProperty({ description: 'Fecha de creación' })
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @ApiProperty({ description: 'Fecha de actualización' })
  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @ManyToOne(() => Operator, (operator) => operator.evaluations)
  @JoinColumn({ name: 'operator_id' })
  operator: Operator;

  @ManyToOne(() => User, (user) => user.evaluations)
  @JoinColumn({ name: 'evaluator_id' })
  evaluator: User;

  @ManyToOne(() => Area, (area) => area.evaluations)
  @JoinColumn({ name: 'area_id' })
  area: Area;

  @ManyToOne(() => Module, (module) => module.evaluations)
  @JoinColumn({ name: 'module_id' })
  module: Module;

  @OneToMany(() => EvaluationDetail, (detail) => detail.evaluation, { cascade: true })
  details: EvaluationDetail[];

  @OneToMany(() => EvaluationPhoto, (photo) => photo.evaluation, { cascade: true })
  photos: EvaluationPhoto[];
}