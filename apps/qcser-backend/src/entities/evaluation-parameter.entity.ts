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
import { Subprocess } from './subprocess.entity';
import { EvaluationDetail } from './evaluation-detail.entity';

@Entity('evaluation_parameters')
@Unique(['subprocessId', 'code', 'version'])
export class EvaluationParameter {
  @ApiProperty({ description: 'ID del parámetro de evaluación' })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({ description: 'ID del subproceso' })
  @Column({ name: 'subprocess_id' })
  subprocessId: number;

  @ApiProperty({ description: 'Código del parámetro' })
  @Column({ length: 50 })
  code: string;

  @ApiProperty({ description: 'Nombre del parámetro' })
  @Column({ length: 255 })
  name: string;

  @ApiProperty({ description: 'Descripción del parámetro' })
  @Column({ type: 'text', nullable: true })
  description: string;

  @ApiProperty({ description: 'Porcentaje de peso del parámetro' })
  @Column({ name: 'weight_percentage', type: 'decimal', precision: 5, scale: 2 })
  weightPercentage: number;

  @ApiProperty({ description: 'Versión del parámetro' })
  @Column({ default: 1 })
  version: number;

  @ApiProperty({ description: 'Fecha de vigencia desde' })
  @Column({ name: 'effective_from', type: 'date', default: () => 'CURRENT_DATE' })
  effectiveFrom: Date;

  @ApiProperty({ description: 'Fecha de vigencia hasta' })
  @Column({ name: 'effective_to', type: 'date', nullable: true })
  effectiveTo: Date;

  @ApiProperty({ description: 'Estado activo del parámetro' })
  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @ApiProperty({ description: 'Fecha de creación' })
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @ApiProperty({ description: 'Fecha de actualización' })
  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @ManyToOne(() => Subprocess, (subprocess) => subprocess.parameters)
  @JoinColumn({ name: 'subprocess_id' })
  subprocess: Subprocess;

  @OneToMany(() => EvaluationDetail, (detail) => detail.parameter)
  evaluationDetails: EvaluationDetail[];
}