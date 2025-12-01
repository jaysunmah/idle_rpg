const SAVE_KEY = 'idle_rpg_save_v1';

export const saveGame = (gameState) => {
  try {
    const serializedState = JSON.stringify(gameState);
    localStorage.setItem(SAVE_KEY, serializedState);
  } catch (error) {
    console.warn('Failed to save game:', error);
  }
};

export const loadGame = () => {
  try {
    const serializedState = localStorage.getItem(SAVE_KEY);
    if (!serializedState) return null;
    return JSON.parse(serializedState);
  } catch (error) {
    console.warn('Failed to load game:', error);
    return null;
  }
};

export const clearSave = () => {
  try {
    localStorage.removeItem(SAVE_KEY);
  } catch (error) {
    console.warn('Failed to clear save:', error);
  }
};
