import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { Module } from './module.entity';
import { Area } from './area.entity';
import { RoseVariety } from './rose-variety.entity';
import { Evaluation } from './evaluation.entity';

export enum OperatorStatus {
  ACTIVO = 'activo',
  INACTIVO = 'inactivo',
  BAJA = 'baja',
}

@Entity('operators')
export class Operator {
  @ApiProperty({ description: 'ID del operario' })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({ description: 'ID de empleado del operario' })
  @Column({ name: 'employee_id', unique: true, length: 50 })
  employeeId: string;

  @ApiProperty({ description: 'Nombre completo del operario' })
  @Column({ name: 'full_name' })
  fullName: string;

  @ApiProperty({ description: 'Fecha de contratación' })
  @Column({ name: 'hire_date', type: 'date' })
  hireDate: Date;

  @ApiProperty({ description: 'Tiene discapacidad' })
  @Column({ name: 'has_disability', default: false })
  hasDisability: boolean;

  @ApiProperty({ description: 'Descripción de la discapacidad' })
  @Column({ name: 'disability_description', type: 'text', nullable: true })
  disabilityDescription: string;

  @ApiProperty({ description: 'ID del módulo asignado' })
  @Column({ name: 'module_id' })
  moduleId: number;

  @ApiProperty({ description: 'ID del área asignada' })
  @Column({ name: 'area_id' })
  areaId: number;

  @ApiProperty({ description: 'Código del cuadrante asignado' })
  @Column({ name: 'quadrant_code', length: 20 })
  quadrantCode: string;

  @ApiProperty({ description: 'ID de la variedad de rosa asignada' })
  @Column({ name: 'rose_variety_id', nullable: true })
  roseVarietyId: number;

  @ApiProperty({ description: 'Estado del operario', enum: OperatorStatus })
  @Column({
    type: 'enum',
    enum: OperatorStatus,
    default: OperatorStatus.ACTIVO,
  })
  status: OperatorStatus;

  @ApiProperty({ description: 'Fecha de creación' })
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @ApiProperty({ description: 'Fecha de actualización' })
  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @ManyToOne(() => Module, (module) => module.operators)
  @JoinColumn({ name: 'module_id' })
  module: Module;

  @ManyToOne(() => Area, (area) => area.operators)
  @JoinColumn({ name: 'area_id' })
  area: Area;

  @ManyToOne(() => RoseVariety, (roseVariety) => roseVariety.operators)
  @JoinColumn({ name: 'rose_variety_id' })
  roseVariety: RoseVariety;

  @OneToMany(() => Evaluation, (evaluation) => evaluation.operator)
  evaluations: Evaluation[];
}