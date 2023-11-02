const express = require('express');
const fs = require('fs');
const app = express();
app.use(express.text());
fs.writeFile('runtime/coordinates.txt', "", (err) => { })
fs.writeFile('runtime/refreshmap.txt', "", (err) => { })


app.post('/coordinates', (req, res) => {
    const textData = req.body.toString();
    fs.writeFile('runtime/coordinates.txt', textData, (err) => {
        if (err) {
            console.error(err);
            res.status(500).send('Server Error');
        } else {
            res.status(200).send('Coordinates written successfully');
        }
    });
});

app.post('/refreshmap', (req, res) => {
    const textData = req.body.toString();
    fs.writeFile('runtime/refreshmap.txt', textData, (err) => {
        if (err) {
            console.error(err);
            res.status(500).send('Server Error');
        } else {
            res.status(200).send('Refresh map written successfully');
        }
    });
});

app.listen(4545);
