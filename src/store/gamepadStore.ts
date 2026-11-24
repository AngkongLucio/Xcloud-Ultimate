import {storage} from './mmkv';
import {debugFactory} from '../utils/debug';
const log = debugFactory('gamepadStore');

const STORE_KEY = 'user.vgamepad';

const readSettings = (): Record<string, any> => {
  const stored = storage.getString(STORE_KEY);
  if (!stored) {
    return {};
  }
  try {
    const parsed: unknown = JSON.parse(stored);
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed)
      ? (parsed as Record<string, any>)
      : {};
  } catch {
    return {};
  }
};

export const saveSettings = (name: string, params: any) => {
  log.info('SaveSettings:', name, JSON.stringify(params));
  const settings = readSettings();
  settings[name] = params;
  storage.set(STORE_KEY, JSON.stringify(settings));
};

export const deleteSetting = (name: string) => {
  log.info('deleteSetting:', name);
  const settings = readSettings();
  delete settings[name];
  storage.set(STORE_KEY, JSON.stringify(settings));
};

export const getSettings = (): Record<string, any> => readSettings();
