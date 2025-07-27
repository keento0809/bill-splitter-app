import type { Group } from '../types/index.d.ts';
import { generate_data_hash, validate_name } from '../utils/helpers';

const STORAGE_KEY_PREFIX = 'bill_splitter_group_';
const GROUPS_LIST_KEY = 'bill_splitter_groups_list';
const INTEGRITY_SUFFIX = '_integrity';

export const storage_service = {
  get_group: async (groupId: string): Promise<Group | null> => {
    try {
      // セキュリティ強化: 入力検証
      if (!groupId || typeof groupId !== 'string' || groupId.length > 100) {
        return null;
      }

      const data = localStorage.getItem(`${STORAGE_KEY_PREFIX}${groupId}`);
      if (!data) return null;

      const parsed = JSON.parse(data);
      
      // セキュリティ強化: データ整合性チェック
      const storedHash = localStorage.getItem(`${STORAGE_KEY_PREFIX}${groupId}${INTEGRITY_SUFFIX}`);
      if (storedHash) {
        const currentHash = await generate_data_hash(parsed);
        if (currentHash !== storedHash) {
          console.warn('データの整合性チェックに失敗しました');
          return null;
        }
      }

      // セキュリティ強化: データ検証とサニタイズ
      if (!parsed.id || !parsed.name || !Array.isArray(parsed.members) || !Array.isArray(parsed.payments)) {
        return null;
      }

      return {
        ...parsed,
        createdAt: new Date(parsed.createdAt),
        updatedAt: new Date(parsed.updatedAt),
        members: parsed.members.map((member: { createdAt: string; [key: string]: unknown }) => ({
          ...member,
          createdAt: new Date(member.createdAt)
        })),
        payments: parsed.payments.map((payment: { createdAt: string; updatedAt: string; [key: string]: unknown }) => ({
          ...payment,
          createdAt: new Date(payment.createdAt),
          updatedAt: new Date(payment.updatedAt)
        }))
      };
    } catch (error) {
      console.error('Failed to get group:', error);
      return null;
    }
  },

  save_group: async (group: Group): Promise<void> => {
    try {
      // セキュリティ強化: 入力検証
      if (!group || !group.id || !validate_name(group.name)) {
        throw new Error('無効なグループデータ');
      }

      const groupData = JSON.stringify(group);
      
      // セキュリティ強化: データ整合性ハッシュ生成
      const dataHash = await generate_data_hash(group);
      
      localStorage.setItem(`${STORAGE_KEY_PREFIX}${group.id}`, groupData);
      localStorage.setItem(`${STORAGE_KEY_PREFIX}${group.id}${INTEGRITY_SUFFIX}`, dataHash);
      
      const groupsList = await storage_service.get_groups_list();
      if (!groupsList.includes(group.id)) {
        groupsList.push(group.id);
        localStorage.setItem(GROUPS_LIST_KEY, JSON.stringify(groupsList));
      }
    } catch (error) {
      console.error('Failed to save group:', error);
      throw error;
    }
  },

  update_group: async (groupId: string, updates: Partial<Group>): Promise<void> => {
    const existing = await storage_service.get_group(groupId);
    if (existing) {
      const updated = { 
        ...existing, 
        ...updates, 
        updatedAt: new Date() 
      };
      await storage_service.save_group(updated);
    }
  },

  delete_group: async (groupId: string): Promise<void> => {
    try {
      // セキュリティ強化: 入力検証
      if (!groupId || typeof groupId !== 'string') {
        return;
      }
      
      localStorage.removeItem(`${STORAGE_KEY_PREFIX}${groupId}`);
      localStorage.removeItem(`${STORAGE_KEY_PREFIX}${groupId}${INTEGRITY_SUFFIX}`);
      
      const groupsList = await storage_service.get_groups_list();
      const filteredList = groupsList.filter(id => id !== groupId);
      localStorage.setItem(GROUPS_LIST_KEY, JSON.stringify(filteredList));
    } catch (error) {
      console.error('Failed to delete group:', error);
    }
  },

  get_groups_list: async (): Promise<string[]> => {
    try {
      const data = localStorage.getItem(GROUPS_LIST_KEY);
      const groupsList = data ? JSON.parse(data) : [];
      
      // セキュリティ強化: 配列検証
      if (!Array.isArray(groupsList)) {
        return [];
      }
      
      return groupsList.filter(id => typeof id === 'string' && id.length > 0 && id.length <= 100);
    } catch (error) {
      console.error('Failed to get groups list:', error);
      return [];
    }
  },

  clear_all_data: async (): Promise<void> => {
    try {
      const groupsList = await storage_service.get_groups_list();
      groupsList.forEach(groupId => {
        localStorage.removeItem(`${STORAGE_KEY_PREFIX}${groupId}`);
        localStorage.removeItem(`${STORAGE_KEY_PREFIX}${groupId}${INTEGRITY_SUFFIX}`);
      });
      localStorage.removeItem(GROUPS_LIST_KEY);
    } catch (error) {
      console.error('Failed to clear all data:', error);
    }
  }
};