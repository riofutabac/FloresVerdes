import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { Subprocess } from './subprocess.entity';
import { Operator } from './operator.entity';
import { Evaluation } from './evaluation.entity';

@Entity('modules')
export class Module {
  @ApiProperty({ description: 'ID del módulo' })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({ description: 'Código del módulo' })
  @Column({ unique: true, length: 20 })
  code: string;

  @ApiProperty({ description: 'Nombre del módulo' })
  @Column({ length: 100 })
  name: string;

  @ApiProperty({ description: 'Descripción del módulo' })
  @Column({ type: 'text', nullable: true })
  description: string;

  @ApiProperty({ description: 'Estado activo del módulo' })
  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @ApiProperty({ description: 'Fecha de creación' })
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @ApiProperty({ description: 'Fecha de actualización' })
  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @OneToMany(() => Subprocess, (subprocess) => subprocess.module)
  subprocesses: Subprocess[];

  @OneToMany(() => Operator, (operator) => operator.module)
  operators: Operator[];

  @OneToMany(() => Evaluation, (evaluation) => evaluation.module)
  evaluations: Evaluation[];
}