export const MODAL_MODE = {
  BANNER: 'banner',
  DIALOG: 'dialog',
  SHEET: 'sheet',
  MENU: 'menu',
};

export const DEFAULT_MODAL_MODE = MODAL_MODE.BANNER;

export const isValidModalMode = (mode) => Object.values(MODAL_MODE).includes(mode);
