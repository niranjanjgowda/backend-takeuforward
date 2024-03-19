const express = require('express');
const mysql = require('mysql');
const dotenv = require('dotenv');
const cors = require('cors');

dotenv.config();

const app = express();
const port = 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

const connection = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
});

app.post('/submit', (req, res) => {
    
    connection.connect((err) => {
        if (err) throw err;
        console.log('Connected to MySQL database');
    });

    const { username, language, stdin, sourceCode } = req.body;

    const query = 'INSERT INTO submissions (username, language, stdin, source_code) VALUES (?, ?, ?, ?)';
    const values = [username, language, stdin, sourceCode];

    connection.query(query, values, (err, result) => {
        if (err) throw err;
        console.log(`Data inserted with ID: ${result.insertId}`);
        res.send('Data received and saved successfully!');
    });

    connection.end();
});

app.get('/submissions', (req, res) => {
    
    connection.connect((err) => {
        if (err) throw err;
        console.log('Connected to MySQL database');
    });

    const query = 'SELECT * FROM submissions';
    connection.query(query, (err, results) => {
        if (err) throw err;
        res.send(results);
    });

    connection.end();
});

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});