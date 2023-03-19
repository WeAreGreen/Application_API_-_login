const express = require('express');
const bodyParser = require('body-parser');
const mysql = require('mysql');
const colors = require('colors');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// Configurazione del logger
const logger = (message, type) => {
  const logString = `[${message}`;
  console.log(logString);
  const formattedMessage = logString
    .replace(/\x1b\[\d+m/g, '') // Rimuove le formattazioni ANSI dalla stringa
    .replace(/'/g, "''"); // Doppia gli apici per evitare problemi nell'insert nella query
  fs.appendFileSync('log.md', `${formattedMessage}\n\n`);
};

// Funzione per gestire gli errori interni al server
const errorHandler = (err, req, res, next) => {
  logger(`Internal server error: ${err}`, '\x1b[31m[ERROR]\x1b[0m');
  res.status(500).json({ message: 'Internal server error' });
};

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

const db = mysql.createConnection({
  host: 'localhost',
  user: 'admin',
  password: 'password',
  database: 'my_database',
});

db.connect((err) => {
  if (err) {
    logger(`[${new Date().toLocaleString('it-IT')}] \x1b[31m[ERROR] Error connecting to database:\x1b[0m'`, err);
    process.exit(1);
  }
  logger(`[${new Date().toLocaleString('it-IT')}] '\x1b[32m[INFO] Connected to database\x1b[0m'`);
});

// Endpoint per il login
app.post('/login', (req, res) => {
  const { email, password } = req.body;

  db.query('SELECT * FROM users WHERE email = ? AND password = ?', [email, password], (err, result) => {
    if (err) {
      logger(`[${new Date().toLocaleString('it-IT')}] '\x1b[31m[ERROR] Error while logging in with email \x1b[1m${email}:\x1b[0m'`, err);
      res.status(500).json({ message: 'Internal server error' });
    } else if (result.length > 0) {
      logger(`[${new Date().toLocaleString('it-IT')}] '\x1b[32m[SUCCESS] Successful login for email \x1b[1m${email}\x1b[0m'`);
      res.status(200).json({ message: 'Login successful' });
    } else {
      logger(`[${new Date().toLocaleString('it-IT')}] '\x1b[33m[WARNING] Failed login attempt for email \x1b[1m${email}\x1b[0m'`);
      res.status(401).json({ message: 'Invalid credentials' });
    }
  });
});

// Endpoint per la creazione di un nuovo utente
app.post('/users', (req, res) => {
  const { email, password } = req.body;

  db.query('SELECT * FROM users WHERE email = ?', [email], (err, result) => {
    if (err) {
      logger(`[${new Date().toLocaleString('it-IT')}] '\x1b[31m[ERROR] Error while creating user with email \x1b[1m${email}:\x1b[0m'`, err);
      res.status(500).json({ message: 'Internal server error' });
    } else if (result.length > 0) {
      logger(`[${new Date().toLocaleString('it-IT')}] '\x1b[33m[WARNING] Failed user creation attempt for existing email \x1b[1m${email}\x1b[0m'`);
      res.status(400).json({ message: 'Email already exists' });
    } else {
      db.query('INSERT INTO users (email, password) VALUES (?, ?)', [email, password], (err, result) => {
        if (err) {
          logger(`[${new Date().toLocaleString('it-IT')}] '\x1b[31m[ERROR] Error while creating user with email \x1b[1m${email}:\x1b[0m'`, err);
          res.status(500).json({ message: 'Internal server error' });
        } else {
          logger(`[${new Date().toLocaleString('it-IT')}] '\x1b[32m[SUCCESS] User with email \x1b[1m${email}\x1b[0m created\x1b[0m'`);
          res.status(201).json({ message: 'User created' });
        }
      });
    }
  });
});

app.listen(PORT, () => {
  logger(`[${new Date().toLocaleString('it-IT')}] '\x1b[36m[INFO] Server running on port ${PORT}\x1b[0m'`);
});

// Middleware per gestire richieste errate
app.use((req, res) => {
  res.status(404).json({ message: 'Invalid endpoint' });
});

// Middleware per gestire errori interni al server
app.use((err, req, res, next) => {
  logger('\x1b[31m%s\x1b[0m', 'Internal server error:', err);
  res.status(500).json({ message: 'Internal server error' });
});
 

