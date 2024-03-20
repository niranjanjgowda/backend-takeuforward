const express = require('express');
const mysql = require('mysql');
const dotenv = require('dotenv');
const cors = require('cors');
const redis = require('redis');
const axios = require('axios');


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

const redisClient = redis.createClient({
    password: process.env.REDIS_PASSWORD,
    socket: {
        host: process.env.REDIS_HOST,
        port: process.env.REDIS_PORT
    }
});

redisClient.connect((err) => {
    if (err) throw err;
    console.log('Connected to Redis');
});

connection.connect((err) => {
    if (err) throw err;
    console.log('Connected to MySQL database');
});

app.get('/', (req, res) => {
    res.send('Api live!');
});


app.post('/submit', async (req, res) => {
    const { username, language, stdin, sourceCode, questionNumber } = req.body;
    const languages = { "C++": 52, "Java": 62, "JavaScript": 63, "Python": 71 }
    var postData = null

    if (questionNumber === undefined || questionNumber === null || questionNumber === '') {
        return res.status(400).send('Question number is not valid!');
    }
    else {
        if (questionNumber == 1) {
            postData = {
                language_id: languages[language],
                source_code: sourceCode,
                stdin: stdin,
                expected_output: "Hello world"
            }
        }
    }

    const options = {
        method: 'POST',
        url: 'https://judge0-ce.p.rapidapi.com/submissions',
        params: {
            base64_encoded: 'true',
            fields: '*'
        },
        headers: {
            'content-type': 'application/json',
            'Content-Type': 'application/json',
            'X-RapidAPI-Key': process.env.RAPID_API_KEY,
            'X-RapidAPI-Host': 'judge0-ce.p.rapidapi.com'
        },
        data: postData
    };

    const response = await axios.request(options);
    const token = response.data.token;

    const getoptions = {
        method: 'GET',
        url: `https://judge0-ce.p.rapidapi.com/submissions/${token}`,
        params: {
            base64_encoded: 'true',
            fields: '*'
        },
        headers: {
            'X-RapidAPI-Key': process.env.RAPID_API_KEY,
            'X-RapidAPI-Host': 'judge0-ce.p.rapidapi.com'
        }
    };

    try {
        const getresponse = await axios.request(getoptions);
        //we can get whatever we want from the response
        const compilelog = getresponse.data.status.description;

        const query = 'INSERT INTO submissions (username, language, stdin, source_code,token, compilelog) VALUES (?, ?, ?, ?, ?, ?)';
        const values = [username, language, stdin, sourceCode, token, compilelog];

        connection.query(query, values, (err, result) => {
            if (err) throw err;
            console.log(`Data inserted with ID: ${result.insertId}`);
        });
        res.send(getresponse.data);

    } catch (error) {
        console.error(error);
    }
});

app.get('/submissions', async (req, res) => {
    const query = 'SELECT username, language, stdin, source_code, compilelog  FROM submissions';
    connection.query(query, (err, results) => {
        if (err) throw err;
        res.send(results);
    });
});

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});