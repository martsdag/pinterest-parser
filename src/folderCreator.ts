import { promises as fs } from 'fs';
import path from 'path';

export const createFolderInPublic = async (folderName: string) => {
  const projectRoot = path.resolve(__dirname, '..');
  const folderPath = path.join(projectRoot, 'public', folderName);

  try {
    await fs.mkdir(folderPath, { recursive: true });
    console.log(`Папка "${folderPath}" создана`);
    return folderPath;
  } catch (error) {
    console.error(`Ошибка:`, error);
    throw error;
  }
};
