'use client';

import {
  DEFAULT_BREAKFAST_SELECTION,
  DEFAULT_LUNCH_SELECTION,
} from './menu-data';
import type { BreakfastSelection, LunchSelection } from './types';

const KEYS = {
  NAME: 'ecsad_panelist_name',
  TOKEN: 'ecsad_device_token',
  BREAKFAST: 'ecsad_breakfast_draft',
  LUNCH: 'ecsad_lunch_draft',
  LUNCH_VERSION: 'ecsad_lunch_draft_version',
} as const;

const LUNCH_DRAFT_VERSION = '2';

export function getSavedPanelistName(): string {
  if (typeof window === 'undefined') return '';
  return localStorage.getItem(KEYS.NAME) || '';
}

export function savePanelistName(name: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(KEYS.NAME, name.trim());
}

export function getOrCreateDeviceToken(): string {
  if (typeof window === 'undefined') return '0000';
  let token = localStorage.getItem(KEYS.TOKEN);
  if (!token) {
    const bytes = new Uint8Array(2);
    crypto.getRandomValues(bytes);
    token = Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
    localStorage.setItem(KEYS.TOKEN, token);
  }
  return token;
}

export function getBreakfastDraft(): BreakfastSelection {
  if (typeof window === 'undefined') return DEFAULT_BREAKFAST_SELECTION;
  try {
    const raw = localStorage.getItem(KEYS.BREAKFAST);
    if (!raw) return DEFAULT_BREAKFAST_SELECTION;
    const parsed = JSON.parse(raw) as Partial<BreakfastSelection>;
    if (
      Array.isArray(parsed.food) &&
      typeof parsed.coffee === 'string' &&
      typeof parsed.drink === 'string'
    ) {
      return {
        food: parsed.food,
        coffee: parsed.coffee,
        drink: parsed.drink,
      };
    }
  } catch {
    // Ignore invalid storage
  }
  return DEFAULT_BREAKFAST_SELECTION;
}

export function saveBreakfastDraft(draft: BreakfastSelection): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(KEYS.BREAKFAST, JSON.stringify(draft));
}

export function getLunchDraft(): LunchSelection {
  if (typeof window === 'undefined') return DEFAULT_LUNCH_SELECTION;
  try {
    const raw = localStorage.getItem(KEYS.LUNCH);
    if (!raw) return DEFAULT_LUNCH_SELECTION;
    const parsed = JSON.parse(raw) as Partial<LunchSelection>;
    if (
      Array.isArray(parsed.food) &&
      Array.isArray(parsed.fruit) &&
      typeof parsed.rice === 'string' &&
      typeof parsed.drink === 'string'
    ) {
      const isLegacyDraft =
        localStorage.getItem(KEYS.LUNCH_VERSION) !== LUNCH_DRAFT_VERSION;
      const selection = {
        food: parsed.food,
        fruit: isLegacyDraft
          ? []
          : parsed.fruit.filter((fruit) => fruit !== 'Grape'),
        rice: parsed.rice,
        drink: parsed.drink,
      };
      if (isLegacyDraft) saveLunchDraft(selection);
      return selection;
    }
  } catch {
    // Ignore invalid storage
  }
  return DEFAULT_LUNCH_SELECTION;
}

export function saveLunchDraft(draft: LunchSelection): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(KEYS.LUNCH, JSON.stringify(draft));
  localStorage.setItem(KEYS.LUNCH_VERSION, LUNCH_DRAFT_VERSION);
}
