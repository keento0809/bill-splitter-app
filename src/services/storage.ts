import type { Group } from '../types/index.d.ts';

const STORAGE_KEY_PREFIX = 'bill_splitter_group_';
const GROUPS_LIST_KEY = 'bill_splitter_groups_list';

export const storage_service = {
  get_group: (groupId: string): Group | null => {
    try {
      const data = localStorage.getItem(`${STORAGE_KEY_PREFIX}${groupId}`);
      if (!data) return null;

      const parsed = JSON.parse(data);
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

  save_group: (group: Group): void => {
    try {
      localStorage.setItem(`${STORAGE_KEY_PREFIX}${group.id}`, JSON.stringify(group));
      
      const groupsList = storage_service.get_groups_list();
      if (!groupsList.includes(group.id)) {
        groupsList.push(group.id);
        localStorage.setItem(GROUPS_LIST_KEY, JSON.stringify(groupsList));
      }
    } catch (error) {
      console.error('Failed to save group:', error);
    }
  },

  update_group: (groupId: string, updates: Partial<Group>): void => {
    const existing = storage_service.get_group(groupId);
    if (existing) {
      const updated = { 
        ...existing, 
        ...updates, 
        updatedAt: new Date() 
      };
      storage_service.save_group(updated);
    }
  },

  delete_group: (groupId: string): void => {
    try {
      localStorage.removeItem(`${STORAGE_KEY_PREFIX}${groupId}`);
      
      const groupsList = storage_service.get_groups_list();
      const filteredList = groupsList.filter(id => id !== groupId);
      localStorage.setItem(GROUPS_LIST_KEY, JSON.stringify(filteredList));
    } catch (error) {
      console.error('Failed to delete group:', error);
    }
  },

  get_groups_list: (): string[] => {
    try {
      const data = localStorage.getItem(GROUPS_LIST_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Failed to get groups list:', error);
      return [];
    }
  },

  clear_all_data: (): void => {
    try {
      const groupsList = storage_service.get_groups_list();
      groupsList.forEach(groupId => {
        localStorage.removeItem(`${STORAGE_KEY_PREFIX}${groupId}`);
      });
      localStorage.removeItem(GROUPS_LIST_KEY);
    } catch (error) {
      console.error('Failed to clear all data:', error);
    }
  }
};