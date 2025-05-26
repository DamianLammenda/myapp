// Requiere: npm install axios xml2js fs-extra

const axios = require('axios');
const xml2js = require('xml2js');
const fs = require('fs-extra');
const path = require('path');

// Configuración
const PLEX_URL = 'http://192.168.1.200:32400';
const SECTION_ID = 5;  // <-- Cambiado para Dibujos Animados
const TOKEN = 's79ccz2DiRze6UsTTdG7';
const OUTPUT_JSON = path.resolve(__dirname, '../frontend/public/data/dibujos.json');
const IMG_DIR = path.resolve(__dirname, '../frontend/public/img/dibujos');


async function fetchDibujosData() {
  const url = `${PLEX_URL}/library/sections/${SECTION_ID}/all?X-Plex-Token=${TOKEN}`;

  const response = await axios.get(url, {
    headers: {
      Accept: 'application/xml', // Forzar XML
    },
    responseType: 'text',
  });

  // Debug opcional
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
    const result = await fetchDibujosData();

    const directories = result?.MediaContainer?.Directory;

    if (!directories || directories.length === 0) {
      console.error('❌ No se encontraron dibujos animados en la sección');
      return;
    }

    const dibujosList = [];

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
      const thumbPath = `/img/dibujos/${thumbFilename}`;

      await downloadImage(thumb, thumbFilename);

      dibujosList.push({
        title,
        originalTitle,
        summary,
        year,
        rating,
        thumb: thumbPath,
      });
    }

    await fs.outputJson(OUTPUT_JSON, dibujosList, { spaces: 2 });
    console.log('✅ Datos de dibujos animados extraídos y guardados exitosamente');
  } catch (err) {
    console.error('❌ Error:', err.message);
  }
}

main();
