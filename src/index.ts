import puppeteer from 'puppeteer';
import commandLineArgs from 'command-line-args';

const optionDefinitions = [{name:'query', alias: 'q', type: String, multiple: true }];

const options = commandLineArgs(optionDefinitions);

(async () => {

  const browser = await puppeteer.launch();
  const page = await browser.newPage();


  try {
    await page.goto(`https://ru.pinterest.com/search/pins/?q=${options.query.join(" ")}`, {'waitUntil':'networkidle0'});
    
    const data = await page.evaluate(async () => {
      window.scrollTo(0, document.body.scrollHeight);

      const resultSelector: NodeListOf<HTMLImageElement> = document.querySelectorAll('a[href^="/pin"] img:not([src^="https://i.pinimg.com/videos"])');
      const resultSelectorArray = Array.from(resultSelector);
      return resultSelectorArray.map((img: HTMLImageElement) => img.src);
    });

    console.log('Ссылки:', data, data.length);
  } catch (error) {
    console.error('Ошибка:', error);
  } finally {
    await browser.close();
  }
})();
