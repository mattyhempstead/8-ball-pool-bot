
console.log('Starting server to listen for ball images');

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
  console.log("received request");
  // console.log(req.body);

  let base64Data = req.body['image-data'].replace(/^data:image\/png;base64,/, "");
  const fileName = `../ball-images/${checksum(base64Data)}.png`;
  require("fs").writeFile(fileName, base64Data, 'base64');

  res.send('Success');
});

app.listen(PORT, () => console.log(`Started server to listen for ball images at http://localhost:${PORT}`))


