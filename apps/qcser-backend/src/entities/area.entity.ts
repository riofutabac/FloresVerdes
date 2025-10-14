import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { Operator } from './operator.entity';
import { Supervisor } from './supervisor.entity';
import { Evaluation } from './evaluation.entity';

@Entity('areas')
export class Area {
  @ApiProperty({ description: 'ID del área' })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({ description: 'Código del área' })
  @Column({ unique: true, length: 10 })
  code: string;

  @ApiProperty({ description: 'Nombre del área' })
  @Column({ length: 100 })
  name: string;

  @ApiProperty({ description: 'Descripción del área' })
  @Column({ type: 'text', nullable: true })
  description: string;

  @ApiProperty({ description: 'Estado activo del área' })
  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @ApiProperty({ description: 'Fecha de creación' })
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @ApiProperty({ description: 'Fecha de actualización' })
  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @OneToMany(() => Operator, (operator) => operator.area)
  operators: Operator[];

  @OneToMany(() => Supervisor, (supervisor) => supervisor.area)
  supervisors: Supervisor[];

  @OneToMany(() => Evaluation, (evaluation) => evaluation.area)
  evaluations: Evaluation[];
}