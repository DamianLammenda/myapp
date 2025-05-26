// Requiere: npm install axios xml2js fs-extra

const axios = require('axios');
const xml2js = require('xml2js');
const fs = require('fs-extra');
const path = require('path');

// Configuración
const PLEX_URL = 'http://192.168.1.200:32400';
const SECTION_ID = 1; // Cambiá esto si tu sección de películas tiene otro ID
const TOKEN = 's79ccz2DiRze6UsTTdG7';

// Construcción de rutas absolutas
const pathToFrontend = path.resolve(__dirname, '../frontend');
const OUTPUT_JSON = path.join(pathToFrontend, 'public/data/peliculas.json');
const IMG_DIR = path.join(pathToFrontend, 'public/img/peliculas');

async function fetchMovieData() {
  const url = `${PLEX_URL}/library/sections/${SECTION_ID}/all?X-Plex-Token=${TOKEN}`;

  const response = await axios.get(url, {
    headers: {
      Accept: 'application/xml',
    },
    responseType: 'text',
  });

  console.log('🔄 XML recibido:', response.data.slice(0, 100));

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
    const result = await fetchMovieData();

    const videos = result?.MediaContainer?.Video;

    if (!videos || videos.length === 0) {
      console.error('❌ No se encontraron películas en la sección');
      return;
    }

    const movieList = [];

    for (const item of Array.isArray(videos) ? videos : [videos]) {
      const title = item.$?.title || '';
      const summary = item.$?.summary || '';
      const rating = item.$?.audienceRating || '';
      const year = item.$?.year || '';
      const ratingKey = item.$?.ratingKey || '';
      const thumb = item.$?.thumb || '';

      if (!thumb) continue;

      const thumbFilename = `${ratingKey}.jpg`;
      const thumbPath = `/img/peliculas/${thumbFilename}`;

      await downloadImage(thumb, thumbFilename);

      movieList.push({
        title,
        summary,
        rating,
        year,
        thumb: thumbPath,
      });
    }

    await fs.outputJson(OUTPUT_JSON, movieList, { spaces: 2 });
    console.log('✅ Películas extraídas y guardadas exitosamente');
  } catch (err) {
    console.error('❌ Error:', err.message);
  }
}

main();
