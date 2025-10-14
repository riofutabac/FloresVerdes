import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { User } from './user.entity';

export enum SyncOperation {
  INSERT = 'INSERT',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE',
}

export enum SyncStatus {
  PENDING = 'pending',
  SYNCED = 'synced',
  ERROR = 'error',
}

@Entity('sync_log')
export class SyncLog {
  @ApiProperty({ description: 'ID del log de sincronización' })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({ description: 'Nombre de la tabla' })
  @Column({ name: 'table_name', length: 100 })
  tableName: string;

  @ApiProperty({ description: 'ID del registro' })
  @Column({ name: 'record_id' })
  recordId: number;

  @ApiProperty({ description: 'Operación realizada', enum: SyncOperation })
  @Column({
    type: 'enum',
    enum: SyncOperation,
  })
  operation: SyncOperation;

  @ApiProperty({ description: 'Estado de sincronización', enum: SyncStatus })
  @Column({
    name: 'sync_status',
    type: 'enum',
    enum: SyncStatus,
    default: SyncStatus.PENDING,
  })
  syncStatus: SyncStatus;

  @ApiProperty({ description: 'Mensaje de error' })
  @Column({ name: 'error_message', type: 'text', nullable: true })
  errorMessage: string;

  @ApiProperty({ description: 'Timestamp local' })
  @Column({ name: 'local_timestamp', type: 'timestamp with time zone' })
  localTimestamp: Date;

  @ApiProperty({ description: 'Timestamp de sincronización' })
  @Column({ name: 'sync_timestamp', type: 'timestamp with time zone', nullable: true })
  syncTimestamp: Date;

  @ApiProperty({ description: 'ID del usuario' })
  @Column({ name: 'user_id', nullable: true })
  userId: string;

  @ApiProperty({ description: 'Fecha de creación' })
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;
}