// Requiere: npm install axios xml2js fs-extra

const axios = require('axios');
const xml2js = require('xml2js');
const fs = require('fs-extra');
const path = require('path');

// Configuración
const PLEX_URL = 'http://192.168.1.200:32400';
const SECTION_ID = 4;
const TOKEN = 's79ccz2DiRze6UsTTdG7';
const OUTPUT_JSON = '../frontend/public/data/anime.json';
const IMG_DIR = '../frontend/public/img/anime';

async function fetchAnimeData() {
  const url = `${PLEX_URL}/library/sections/${SECTION_ID}/all?X-Plex-Token=${TOKEN}`;

  const response = await axios.get(url, {
    headers: {
      Accept: 'application/xml', // 🔁 Forzar XML
    },
    responseType: 'text', // Muy importante para que no lo convierta automáticamente
  });

  // Opcional: podés ver los primeros caracteres para asegurarte
  console.log('Raw:', response.data.slice(0, 100));

  const parser = new xml2js.Parser({ explicitArray: false });
  const parsed = await parser.parseStringPromise(response.data);

  return parsed;
}

async function downloadImage(relativeUrl, filename) {
  const url = `${PLEX_URL}${relativeUrl}?X-Plex-Token=${TOKEN}`;
  const filePath = path.join(IMG_DIR, filename);
  const writer = fs.createWriteStream(filePath);
  const response = await axios({ url, method: 'GET', responseType: 'stream' });
  response.data.pipe(writer);
  return new Promise((resolve, reject) => {
    writer.on('finish', resolve);
    writer.on('error', reject);
  });
}

async function main() {
  try {
    await fs.ensureDir(IMG_DIR);
    const result = await fetchAnimeData();

    const directories = result?.MediaContainer?.Directory;

    if (!directories || directories.length === 0) {
      console.error('❌ No se encontraron animes en la sección');
      return;
    }

    const animeList = [];

    for (const item of Array.isArray(directories) ? directories : [directories]) {
      const title = item.$?.title || '';
      const originalTitle = item.$?.originalTitle || '';
      const summary = item.$?.summary || '';
      const rating = item.$?.audienceRating || '';
      const year = item.$?.year || '';
      const ratingKey = item.$?.ratingKey || '';
      const thumb = item.$?.thumb || '';

      if (!thumb) continue;

      const thumbFilename = `${ratingKey}.jpg`;
      const thumbPath = `/img/anime/${thumbFilename}`;

      await downloadImage(thumb, thumbFilename);

      animeList.push({
        title,
        originalTitle,
        summary,
        year,
        rating,
        thumb: thumbPath,
      });
    }

    await fs.outputJson(OUTPUT_JSON, animeList, { spaces: 2 });
    console.log('✅ Datos extraídos y guardados exitosamente');
  } catch (err) {
    console.error('❌ Error:', err.message);
  }
}

main();
