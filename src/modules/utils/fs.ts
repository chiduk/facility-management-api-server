import fs from 'fs/promises';

const emptyDir = async (path: string) => {
  const files = await fs.readdir(path);
  // eslint-disable-next-line no-restricted-syntax
  for await (const file of files) {
    const filePath = `${path}/${file}`;
    try {
      const stats = await fs.stat(filePath);
      if (stats.isDirectory()) {
        await emptyDir(filePath);
        await fs.rmdir(filePath);
      } else {
        await fs.unlink(filePath);
      }
    } catch (error) {
      console.error(`Failed to delete file or directory: ${filePath}`);
    }
  }
};

export default emptyDir;
