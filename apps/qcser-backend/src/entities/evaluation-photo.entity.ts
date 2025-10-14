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
import { Subprocess } from './subprocess.entity';

@Entity('evaluation_photos')
export class EvaluationPhoto {
  @ApiProperty({ description: 'ID de la foto de evaluación' })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({ description: 'ID de la evaluación' })
  @Column({ name: 'evaluation_id' })
  evaluationId: number;

  @ApiProperty({ description: 'ID del subproceso' })
  @Column({ name: 'subprocess_id' })
  subprocessId: number;

  @ApiProperty({ description: 'Ruta del archivo' })
  @Column({ name: 'file_path', length: 500 })
  filePath: string;

  @ApiProperty({ description: 'Nombre del archivo' })
  @Column({ name: 'file_name' })
  fileName: string;

  @ApiProperty({ description: 'Tamaño del archivo en bytes' })
  @Column({ name: 'file_size', nullable: true })
  fileSize: number;

  @ApiProperty({ description: 'Tipo MIME del archivo' })
  @Column({ name: 'mime_type', length: 100, nullable: true })
  mimeType: string;

  @ApiProperty({ description: 'Descripción de la foto' })
  @Column({ type: 'text', nullable: true })
  description: string;

  @ApiProperty({ description: 'Orden de carga' })
  @Column({ name: 'upload_order', default: 0 })
  uploadOrder: number;

  @ApiProperty({ description: 'Fecha de creación' })
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @ManyToOne(() => Evaluation, (evaluation) => evaluation.photos, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'evaluation_id' })
  evaluation: Evaluation;

  @ManyToOne(() => Subprocess, (subprocess) => subprocess.photos)
  @JoinColumn({ name: 'subprocess_id' })
  subprocess: Subprocess;
}