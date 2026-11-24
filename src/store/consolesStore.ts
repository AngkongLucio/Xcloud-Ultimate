import {storage} from './mmkv';
import {debugFactory} from '../utils/debug';
const log = debugFactory('consolesStore');

const STORE_KEY = 'user.consoles';

const readConsoles = (): any[] => {
  const stored = storage.getString(STORE_KEY);
  if (!stored) {
    return [];
  }
  try {
    const parsed: unknown = JSON.parse(stored);
    return Array.isArray(parsed)
      ? parsed.filter(
          item => item !== null && typeof item === 'object' && !Array.isArray(item),
        )
      : [];
  } catch {
    return [];
  }
};

export const saveConsoles = (consoles: any) => {
  const safeConsoles = Array.isArray(consoles) ? consoles : [];
  log.info('saveConsoles:', JSON.stringify(safeConsoles));
  storage.set(STORE_KEY, JSON.stringify(safeConsoles));
};

export const deleteConsole = (consoleId: string) => {
  log.info('deleteConsole consoleId:', consoleId);
  const newConsoles = readConsoles().filter(
    item => item.consoleId !== consoleId,
  );
  storage.set(STORE_KEY, JSON.stringify(newConsoles));
};

export const getConsoles = (): any[] => readConsoles();

export const cleanConsoles = () => {
  storage.set(STORE_KEY, JSON.stringify([]));
};
