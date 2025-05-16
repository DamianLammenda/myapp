const express = require('express');
const axios = require('axios');
const cors = require('cors');
const nodemailer = require('nodemailer');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static('frontend'));

// Configuración Plex
const PLEX_SERVER = process.env.PLEX_SERVER;
const PLEX_TOKEN = process.env.PLEX_TOKEN;


// Endpoint para obtener contenido de una biblioteca
app.get('/api/biblioteca/:id', async (req, res) => {
  const { id } = req.params;
  const url = `${PLEX_SERVER}/library/sections/${id}/all?X-Plex-Token=${PLEX_TOKEN}`;

  try {
    const response = await axios.get(url, {
      responseType: 'text',
      headers: {
        'Accept': 'application/xml'
      }
    });
    res.set('Content-Type', 'application/xml');
    res.send(response.data);
  } catch (error) {
    console.error('Error al obtener datos de Plex:', error.message);
    if (error.response) {
      console.error('Código de estado:', error.response.status);
      console.error('Respuesta:', error.response.data);
    }
    res.status(500).send('Error al obtener datos de Plex');
  }
});

app.get('/api/thumb', async (req, res) => {
  const { path } = req.query;
  if (!path) return res.status(400).send('Falta el parámetro "path"');

  const imageUrl = `${PLEX_SERVER}${path}?X-Plex-Token=${PLEX_TOKEN}`;
  console.log('Cargando imagen desde:', imageUrl);

  try {
    const response = await axios.get(imageUrl, {
      responseType: 'arraybuffer'
    });

    res.set('Content-Type', response.headers['content-type']);
    res.send(response.data);
  } catch (error) {
    console.error('Error al obtener imagen de Plex:', error.message);
    res.status(500).send('Error al obtener imagen');
  }
});




app.post('/invite', async (req, res) => {
  const { name, email, phone } = req.body;

  if (!name || !email || !phone) {
    return res.status(400).send('Faltan datos');
  }

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.MAIL_USER,      // ej: plexsender@gmail.com
      pass: process.env.MAIL_PASS       // contraseña o app password
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