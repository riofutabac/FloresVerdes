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

@Entity('rose_varieties')
export class RoseVariety {
  @ApiProperty({ description: 'ID de la variedad de rosa' })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({ description: 'Código de la variedad' })
  @Column({ unique: true, length: 20 })
  code: string;

  @ApiProperty({ description: 'Nombre de la variedad' })
  @Column({ length: 100 })
  name: string;

  @ApiProperty({ description: 'Descripción de la variedad' })
  @Column({ type: 'text', nullable: true })
  description: string;

  @ApiProperty({ description: 'Color de la rosa' })
  @Column({ length: 50, nullable: true })
  color: string;

  @ApiProperty({ description: 'Longitud mínima del tallo (cm)' })
  @Column({ name: 'stem_length_min', nullable: true })
  stemLengthMin: number;

  @ApiProperty({ description: 'Longitud máxima del tallo (cm)' })
  @Column({ name: 'stem_length_max', nullable: true })
  stemLengthMax: number;

  @ApiProperty({ description: 'Estado activo de la variedad' })
  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @ApiProperty({ description: 'Fecha de creación' })
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @ApiProperty({ description: 'Fecha de actualización' })
  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @OneToMany(() => Operator, (operator) => operator.roseVariety)
  operators: Operator[];
}