
console.log('Starting server to listen for ball images');

const fs = require("fs");

const checksum = require('checksum');

const express = require('express');
const app = express();
const PORT = 8001;

const cors = require('cors');
app.use(cors());

const bodyParser = require('body-parser');
app.use(express.json());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
  extended: true
}));

app.post('/', (req, res) => {
  console.log("received image");

  let base64Data = req.body['image-data'].replace(/^data:image\/png;base64,/, "");
  const fileName = `../ball-images/${checksum(base64Data)}.png`;
  console.log(fileName);

  fs.writeFile(fileName, base64Data, 'base64', ()=>{});
  
  fs.readdir('../ball-images', (err, files) => {
    console.log(`Currently downloaded ${files.length} images.`);
  });


  res.send('Success');
});

app.listen(PORT, () => console.log(`Started server to listen for ball images at http://localhost:${PORT}`))


