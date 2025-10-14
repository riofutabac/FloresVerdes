import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { Evaluation } from './evaluation.entity';
import { EvaluationParameter } from './evaluation-parameter.entity';

@Entity('evaluation_details')
export class EvaluationDetail {
  @ApiProperty({ description: 'ID del detalle de evaluación' })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({ description: 'ID de la evaluación' })
  @Column({ name: 'evaluation_id' })
  evaluationId: number;

  @ApiProperty({ description: 'ID del parámetro' })
  @Column({ name: 'parameter_id' })
  parameterId: number;

  @ApiProperty({ description: 'Indica si cumple con el parámetro' })
  @Column({ name: 'is_compliant' })
  isCompliant: boolean;

  @ApiProperty({ description: 'Peso aplicado del parámetro' })
  @Column({ name: 'weight_applied', type: 'decimal', precision: 5, scale: 2 })
  weightApplied: number;

  @ApiProperty({ description: 'Observaciones del parámetro' })
  @Column({ type: 'text', nullable: true })
  observations: string;

  @ApiProperty({ description: 'Fecha de creación' })
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @ManyToOne(() => Evaluation, (evaluation) => evaluation.details, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'evaluation_id' })
  evaluation: Evaluation;

  @ManyToOne(() => EvaluationParameter, (parameter) => parameter.evaluationDetails)
  @JoinColumn({ name: 'parameter_id' })
  parameter: EvaluationParameter;
}