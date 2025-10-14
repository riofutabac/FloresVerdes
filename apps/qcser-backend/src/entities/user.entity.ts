import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { Evaluation } from './evaluation.entity';

export enum UserRole {
  ADMINISTRADOR = 'ADMINISTRADOR',
  JEFA_CALIDAD = 'JEFE_CALIDAD',
  GERENTE_GENERAL = 'GERENTE_GENERAL',
}

@Entity('users')
export class User {
  @ApiProperty({ description: 'UUID del usuario' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ description: 'Correo electrónico del usuario' })
  @Column({ unique: true })
  email: string;

  @ApiProperty({ description: 'Nombre completo del usuario' })
  @Column({ name: 'full_name' })
  fullName: string;

  @ApiProperty({ description: 'Rol del usuario', enum: UserRole })
  @Column({
    type: 'enum',
    enum: UserRole,
  })
  role: UserRole;

  @ApiProperty({ description: 'Estado activo del usuario' })
  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @ApiProperty({ description: 'Fecha de creación' })
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @ApiProperty({ description: 'Fecha de actualización' })
  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @OneToMany(() => Evaluation, (evaluation) => evaluation.evaluator)
  evaluations: Evaluation[];
}