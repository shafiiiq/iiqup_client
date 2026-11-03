export const pickFiles = ({ accept = '', multiple = false } = {}) =>
  new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = accept;
    input.multiple = multiple;
    input.addEventListener('change', () => resolve(Array.from(input.files ?? [])));
    input.addEventListener('cancel', () => resolve([]));
    input.click();
  });

export const buildFileKey = (file) => `${file.name}:${file.size}:${file.lastModified}`;