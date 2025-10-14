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
import { Module } from './module.entity';
import { EvaluationParameter } from './evaluation-parameter.entity';
import { EvaluationPhoto } from './evaluation-photo.entity';

@Entity('subprocesses')
@Unique(['moduleId', 'code'])
export class Subprocess {
  @ApiProperty({ description: 'ID del subproceso' })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({ description: 'ID del módulo' })
  @Column({ name: 'module_id' })
  moduleId: number;

  @ApiProperty({ description: 'Código del subproceso' })
  @Column({ length: 20 })
  code: string;

  @ApiProperty({ description: 'Nombre del subproceso' })
  @Column({ length: 100 })
  name: string;

  @ApiProperty({ description: 'Descripción del subproceso' })
  @Column({ type: 'text', nullable: true })
  description: string;

  @ApiProperty({ description: 'Índice de orden' })
  @Column({ name: 'order_index', default: 0 })
  orderIndex: number;

  @ApiProperty({ description: 'Estado activo del subproceso' })
  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @ApiProperty({ description: 'Fecha de creación' })
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @ApiProperty({ description: 'Fecha de actualización' })
  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @ManyToOne(() => Module, (module) => module.subprocesses)
  @JoinColumn({ name: 'module_id' })
  module: Module;

  @OneToMany(() => EvaluationParameter, (parameter) => parameter.subprocess)
  parameters: EvaluationParameter[];

  @OneToMany(() => EvaluationPhoto, (photo) => photo.subprocess)
  photos: EvaluationPhoto[];
}