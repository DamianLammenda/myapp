const express = require('express');
const axios = require('axios');
const cors = require('cors');
const nodemailer = require('nodemailer');
require('dotenv').config();

const app = express();
app.use(express.static('public'));
app.use(cors());
app.use(express.json());
app.use(express.static('frontend'));
//app.use(express.static(path.join(__dirname, '../frontend')));


const TMDB_API_KEY = process.env.TMDB_API_KEY;
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';

// ✅ Películas populares
app.get('/api/peliculas', async (req, res) => {
  try {
    const response = await axios.get(`${TMDB_BASE_URL}/movie/popular`, {
      params: {
        api_key: TMDB_API_KEY,
        language: 'es-MX',
        page: 1
      }
    });
    res.json(response.data.results);
  } catch (err) {
    console.error('Error al obtener películas:', err.message);
    res.status(500).send('Error al obtener películas populares');
  }
});

// ✅ Series populares
app.get('/api/series', async (req, res) => {
  try {
    const response = await axios.get(`${TMDB_BASE_URL}/tv/popular`, {
      params: {
        api_key: TMDB_API_KEY,
        language: 'es-ES',
        page: 1
      }
    });
    res.json(response.data.results);
  } catch (err) {
    console.error('Error al obtener series:', err.message);
    res.status(500).send('Error al obtener series populares');
  }
});

// ✅ Buscar contenido (películas y series)
app.get('/api/buscar', async (req, res) => {
  const { query } = req.query;
  if (!query) return res.status(400).send('Falta el parámetro "query"');

  try {
    const response = await axios.get(`${TMDB_BASE_URL}/search/multi`, {
      params: {
        api_key: TMDB_API_KEY,
        language: 'es-ES',
        query,
        page: 1,
        include_adult: false
      }
    });
    res.json(response.data.results);
  } catch (err) {
    console.error('Error en la búsqueda:', err.message);
    res.status(500).send('Error al buscar contenido');
  }
});

// ✅ Obtener imagen (solo reenvía la URL de TMDb)
app.get('/api/thumb', (req, res) => {
  const { path, size } = req.query;
  if (!path) return res.status(400).send('Falta el parámetro "path"');

  const imageSize = size || 'w500';
  const imageUrl = `https://image.tmdb.org/t/p/${imageSize}${path}`;
  res.redirect(imageUrl);
});

// ✅ Envío de solicitud por mail
app.post('/invite', async (req, res) => {
  const { name, email, phone } = req.body;

  if (!name || !email || !phone) {
    return res.status(400).send('Faltan datos');
  }

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.MAIL_USER,
      pass: process.env.MAIL_PASS
    }
  });

  const mailOptions = {
    from: `"PLAYPLEX Notificador" <${process.env.MAIL_USER}>`,
    to: 'gestionusuarios05@gmail.com',
    subject: 'Nueva solicitud de acceso a PLAYPLEX',
    text: `
📥 Nueva solicitud de acceso:

👤 Nombre: ${name}
📧 Email: ${email}
📱 Celular: ${phone}
    `.trim()
  };

  try {
    await transporter.sendMail(mailOptions);
    res.sendStatus(200);
  } catch (err) {
    console.error('Error enviando email:', err);
    res.sendStatus(500);
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Servidor activo en http://localhost:${PORT}`);
});
