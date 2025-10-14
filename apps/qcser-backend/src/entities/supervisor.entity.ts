import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { Area } from './area.entity';

@Entity('supervisors')
export class Supervisor {
  @ApiProperty({ description: 'ID del supervisor' })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({ description: 'Nombre completo del supervisor' })
  @Column({ name: 'full_name' })
  fullName: string;

  @ApiProperty({ description: 'ID de empleado del supervisor' })
  @Column({ name: 'employee_id', unique: true, length: 50 })
  employeeId: string;

  @ApiProperty({ description: 'ID del área asignada' })
  @Column({ name: 'area_id' })
  areaId: number;

  @ApiProperty({ description: 'Estado activo del supervisor' })
  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @ApiProperty({ description: 'Fecha de creación' })
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @ApiProperty({ description: 'Fecha de actualización' })
  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @ManyToOne(() => Area, (area) => area.supervisors)
  @JoinColumn({ name: 'area_id' })
  area: Area;
}