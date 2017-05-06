/*
  1. Go hit https://www.videobreakdown.com/media/d0b7632bad/
  2. Issue a request for a new language trascription with the network tab open
  3. Copy the URL for the request including the access token and paste in below.
*/

// Requires

const chalk = require('chalk');
const https = require('https');
const jsonfile = require('jsonfile');
const prependFile = require('prepend-file');

// Globals

const dataDirectory = '../data';
const finalDirectory = '../public/js';
const languages = [
  'Chinese',
  'English',
  'French',
  'German',
  'Italian',
  'Japanese',
  'Portuguese',
  'Russian',
  'Spanish'
];

// Methods

const fetchData = (language, cb) => {
  log('dim', `Fetching ${language}...`);
  let body = [];
  const req = https.request(options(language), (res) => {
    res
      .on('data', (d) => { body.push(d); })
      .on('end', () => {
        let data = processData(Buffer.concat(body).toString());
        jsonfile.writeFileSync(
          `${dataDirectory}/${language.toLowerCase()}.json`,
          data
        );
        log('green', `Successfully wrote ${language.toLowerCase()}.json!`);
        cb(data);
      });
  });
  req.on('error', (e) => {
    console.error(e);
  });

  req.end();
};

const log = (style, msg) => { console.log(chalk[style](msg)); };

//https://www.videobreakdown.com/api/Widget/Breakdowns/d0b7632bad/d0b7632bad/Vtt/?accessToken=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJFeHRlcm5hbFVzZXJJZCI6IiIsIlVzZXJUeXBlIjoiTWljcm9zb2Z0Q29ycEFhZCIsIkJyZWFrZG93bklkIjoiZDBiNzYzMmJhZCIsImlzcyI6Imh0dHBzOi8vd3d3LnZpZGVvYnJlYWtkb3duLmNvbSIsImF1ZCI6Imh0dHBzOi8vd3d3LnZpZGVvYnJlYWtkb3duLmNvbSIsImV4cCI6MTQ5NDEwNDcxNCwibmJmIjoxNDk0MTAwODE0fQ.no5AvHneJWMxTz2yH5ntElNRfCwicoBGNVJma8qu6OA&language=English

const options = (language) => {
  return {
    hostname: 'www.videobreakdown.com',
    port: 443,
    path: `/api/widget/breakdowns/d0b7632bad/?accessToken=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJFeHRlcm5hbFVzZXJJZCI6IiIsIlVzZXJUeXBlIjoiTWljcm9zb2Z0Q29ycEFhZCIsIkJyZWFrZG93bklkIjoiZDBiNzYzMmJhZCIsImlzcyI6Imh0dHBzOi8vd3d3LnZpZGVvYnJlYWtkb3duLmNvbSIsImF1ZCI6Imh0dHBzOi8vd3d3LnZpZGVvYnJlYWtkb3duLmNvbSIsImV4cCI6MTQ5NDEwNDcxNCwibmJmIjoxNDk0MTAwODE0fQ.no5AvHneJWMxTz2yH5ntElNRfCwicoBGNVJma8qu6OA&language=${language}`,
    method: 'GET'
  };
};

const processData = (dataString) => {
  let data = JSON.parse(dataString);
  let transcriptBlocks = data.breakdowns[0].insights.transcriptBlocks;
  let returnData = [];
  for (let block of transcriptBlocks) {
    for (let line of block.lines) {
      let { adjustedTimeRange: { start, end}, text } = line;
      returnData.push({end, start, text});
    }
  }

  return returnData;
};

// Init

let promises = [];
for (let language of languages) {
  let promise = new Promise((res, rej) => {
    fetchData(language, (data) => {
      let d = {};
      d[language.toLowerCase()] = data;
      res(d);
    });
  });
  promises.push(promise);
}

Promise.all(promises).then((values) => {
  let parsedValues = {};
  for (let value of values) {
    let name = Object.keys(value)[0];
    parsedValues[name] = value[name];
  }

  jsonfile.writeFileSync(
    `${finalDirectory}/languages.js`,
    parsedValues
  );

  prependFile(
    `${finalDirectory}/languages.js`,
    'var transcriptionLanguages = ',
    (err) => {
      if (err) { log('red', 'ERROR PREPENDING'); return; }
      log('green', `\r\nSuccessfully wrote languages.js!`);
    }
  );
});



