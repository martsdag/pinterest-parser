import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();
  // const q = 'cats';

  try {
    await page.goto(`https://ru.pinterest.com/search/pins/?q=${process.argv[2]}`, {'waitUntil':'networkidle0'});

    const data = await page.evaluate(() => {
      const resultSelector: NodeListOf<HTMLImageElement> = document.querySelectorAll('a[href^="/pin"] img');
      const resultSelectorArray = Array.from(resultSelector);
      return resultSelectorArray.map((img: HTMLImageElement) => img.src);
    });

    console.log('Ссылки:', data);
  } catch (error) {
    console.error('Ошибка:', error);
  } finally {
    await browser.close();
  }
})();

console.log('Аргументы командной строки:', process.argv);
