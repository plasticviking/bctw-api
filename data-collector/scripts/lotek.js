const pg = require('pg'); // Postgres
const async = require('async'); // Async management
const needle = require('needle'); // HTTP requests
const moment = require('moment'); // Time calculation

const isProd = process.env.NODE_ENV === 'production' ? true : false;

// Set up the database pool
const pgPool = new pg.Pool({
  user: process.env.POSTGRES_USER,
  database: process.env.POSTGRES_DB,
  password: process.env.POSTGRES_PASSWORD,
  host: isProd ? process.env.POSTGRES_SERVER_HOST : 'localhost',
  port: isProd ? process.env.POSTGRES_SERVER_PORT : 5432,
  max: 10
});

// Grab credentials as Environment Variables
const lotexUser = process.env.LOTEX_USER;
const lotexPassword = process.env.LOTEX_PASSWORD;
const lotexUrl = process.env.LOTEX_URL;

// Store the access token globally
let tokenConfig = {};

const insertCollarData = function(records,callback) {
  console.log(records);
  callback(null);
};

const iterateCollars = function(collar,callback) {
  const url = `${lotexUrl}/gps?deviceId=${collar.nDeviceID}`
  console.log(url);

  needle.get(url,tokenConfig,(err,res,body) => {
    if (err) {
      return console.error('Could not get collar list: ',error);
    }
    const records = body
      .flat()
      .filter((e) => { return e && e.RecDateTime && e.DeviceID});

    if (records.length < 1) {
      console.log("no records");
      return callback(null);
    }
     
    insertCollarData(records,callback);
  });

};

const getAllCollars = function (err, _, data) {
  // If error... exit with a message.
  if (err) {return console.error("Could not get a token: ",err)};

  const url = `${lotexUrl}/devices` // the API url
  tokenConfig = { // This get's stored globally
    headers: {Authorization: `bearer ${data.access_token}`}
  }

  const done = function (err) {
    if (err) {
      console.error('Unsuccessfully iterated over collar array: ',err);
    }
    pgPool.end(); // Disconnect from database
  }

  needle.get(url,tokenConfig,(error,res,body) => {
    if (err) {
      return console.error('Could not get collar list: ',error);
    }

    // testing
    const testing = body.slice(0,1);
    //////////

    async.concatSeries(testing,iterateCollars,done); // Testing 
    // async.series(body,iterateCollars,done); // kick off collar iteration
  });
};


/* ## getToken
  Get the authentication token from the API
  Feed the token into the collar aquisitiona
  and iteration function
*/ 
const getToken = function () {
  const data = `username=${lotexUser}&password=${lotexPassword}&grant_type=password`;
  const url = `${lotexUrl}/user/login`;
  const config = {
    content_type: 'application/x-www-form-urlencoded'
  };

  needle.post(url,data,config,getAllCollars);

}

getToken();