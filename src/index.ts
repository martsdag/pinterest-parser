import puppeteer from 'puppeteer';
import commandLineArgs from 'command-line-args';
import path from 'path';
import { ofetch } from 'ofetch';
import { promises as fs } from 'fs';
import { createFolderInPublic } from '@/folderCreator';

const optionDefinitions = [{name:'query', alias: 'q', type: String, multiple: true }];

const options = commandLineArgs(optionDefinitions);

(async () => {

  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  // Is it possible to get more images?  
  await page.setViewport({
    width: 1080,
    height: 1024,
    deviceScaleFactor: 1,
  });

  try {
    await page.goto(`https://ru.pinterest.com/search/pins/?q=${options.query.join(" ")}`, {'waitUntil':'networkidle0'});
    
    const data = await page.evaluate(() => {
      window.scrollTo(0, document.body.scrollHeight);

      const resultSelector: NodeListOf<HTMLImageElement> = document.querySelectorAll('a[href^="/pin"] img:not([src^="https://i.pinimg.com/videos"])');
      const resultSelectorArray = Array.from(resultSelector);
      return resultSelectorArray.map((img: HTMLImageElement) => img.src);
    });

    if (!data.length) {
      throw new Error("Не найдено ни одной ссылки, папка не будет создана.");
    }

  const folderPath = await createFolderInPublic(`${options.query.join("-")}`);

  const downloadImageToOwnFolder = async (url: string) => {
      const response = await ofetch(url, { responseType: 'arrayBuffer' });
      const buffer = Buffer.from(response);

      const filename = path.basename(url.split('?')[0]);

      await fs.writeFile(path.join(folderPath, filename), buffer);
  }

  const downloadImages = data.map(async (url) => {
   await downloadImageToOwnFolder(url);
});

    await Promise.all(downloadImages);

    console.log('Ссылки:', data, data.length);

  } catch (error) {
    console.error('Ошибка:', error);
  } finally {
    await browser.close();
  }
})();
