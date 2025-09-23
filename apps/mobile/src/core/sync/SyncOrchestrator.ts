import { sqliteManager } from './SQLiteManager';
import { httpClient } from '../data/clients';

export class SyncOrchestrator {
  private syncInterval: NodeJS.Timeout | null = null;
  private isOnline = true;

  constructor() {
    // Listen to network changes (you might want to use @react-native-async-storage/async-storage for this)
    this.setupNetworkListener();
  }

  private setupNetworkListener() {
    // Implementation depends on network state library
    // For now, we'll assume online state
  }

  startSync(intervalMs: number = 30000) {
    this.syncInterval = setInterval(() => {
      if (this.isOnline) {
        this.performSync();
      }
    }, intervalMs);
  }

  stopSync() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
  }

  async performSync() {
    try {
      const pendingItems = await sqliteManager.getPendingSyncItems();
      
      for (const item of pendingItems) {
        try {
          await this.syncItem(item);
          await sqliteManager.removeSyncItem(item.id);
          
          if (item.operation === 'INSERT' || item.operation === 'UPDATE') {
            await sqliteManager.markAsSynced(item.table_name, item.record_id);
          }
        } catch (error) {
          console.error(`Failed to sync item ${item.id}:`, error);
          
          // Increment retry count
          // You might want to implement a retry mechanism here
        }
      }
    } catch (error) {
      console.error('Sync error:', error);
    }
  }

  private async syncItem(item: any) {
    const data = JSON.parse(item.data);
    
    switch (item.table_name) {
      case 'evaluaciones':
        await this.syncEvaluacion(item.operation, data, item.record_id);
        break;
      // Add other table sync logic here
      default:
        throw new Error(`Unknown table: ${item.table_name}`);
    }
  }

  private async syncEvaluacion(operation: string, data: any, recordId: string) {
    switch (operation) {
      case 'INSERT':
        await httpClient.post('/api/evaluaciones', { ...data, uuid: recordId });
        break;
      case 'UPDATE':
        await httpClient.put(`/api/evaluaciones/${recordId}`, data);
        break;
      case 'DELETE':
        await httpClient.delete(`/api/evaluaciones/${recordId}`);
        break;
      default:
        throw new Error(`Unknown operation: ${operation}`);
    }
  }

  // Force sync specific record
  async forceSyncRecord(tableName: string, recordId: string) {
    const pendingItems = await sqliteManager.getPendingSyncItems();
    const item = pendingItems.find(
      (item: any) => item.table_name === tableName && item.record_id === recordId
    );
    
    if (item) {
      await this.syncItem(item);
      await sqliteManager.removeSyncItem(item.id);
      await sqliteManager.markAsSynced(tableName, recordId);
    }
  }
}

export const syncOrchestrator = new SyncOrchestrator();