import puppeteer from 'puppeteer';
import commandLineArgs from 'command-line-args';
import path from 'path';
import { ofetch } from 'ofetch';
import { promises as fs } from 'fs';
import { createFolderInPublic } from '@/folderCreator';

const optionDefinitions = [{ name: 'query', alias: 'q', type: String, multiple: true }];
const options = commandLineArgs(optionDefinitions);

const waitFor = (ms: number) => {
  return new Promise (resolve => setTimeout(resolve, ms))
};

(async () => {
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();

  await page.setViewport({
    width: 1080,
    height: 1024,
    deviceScaleFactor: 1,
  });

  try {
    await page.goto(`https://ru.pinterest.com/search/pins/?q=${options.query.join(" ")}`, { waitUntil: 'networkidle2' });

    let imageUrls: Set<string> = new Set();
    const maxScrollAttempts = 10;
    const scrollDelay = 2000;

    for (let i = 0; i < maxScrollAttempts; i++) {
      await page.evaluate(() => {
        window.scrollTo(0, document.body.scrollHeight);
      });

      await waitFor(scrollDelay);

      const newImages = await page.evaluate(() =>
        Array.from(document.querySelectorAll('a[href^="/pin"] img:not([src^="https://i.pinimg.com/videos"])'))
          .map((img) => (img as HTMLImageElement).src)
      );

      const previousSize = imageUrls.size;

      newImages.forEach((img) => imageUrls.add(img));

      if (imageUrls.size === previousSize) {
        break;
      }

    }

    if (imageUrls.size === 0) {
      throw new Error("Не найдено ни одной ссылки, папка не будет создана.");
    }

    const folderPath = await createFolderInPublic(`${options.query.join("-")}`);

    for await (const url of imageUrls) {

      try {
        const response = await ofetch(url, { responseType: 'arrayBuffer' });
        const buffer = Buffer.from(response);
        const filename = path.basename(url.split('?')[0]);

        await fs.writeFile(path.join(folderPath, filename), buffer);

      } catch (err) {
        console.error(`Ошибка загрузки: ${url}`, err);
      }
    }

    console.log('Скачано изображений:', imageUrls.size);

  } catch (error) {
    console.error('Ошибка:', error);
  } finally {
    await browser.close();
  }
})();
