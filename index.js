const fs = require('fs');
const { parse } = require('json2csv');
const axios = require('axios');
var convert = require('xml-js');
const { transform, prettyPrint } = require('camaro')
var xml =
'<?xml version="1.0" encoding="utf-8"?>' +
'<request><dataswitch>' +
'1' +
'</dataswitch></request>';
var xml2 =
'<?xml version: "1.0" encoding="UTF-8"?><request><Action>1</Action></request>';
var xml3 = "<?xml version=\"1.0\" encoding=\"UTF-8\"?><request><Control>1</Control></request>";


let token = '';
async function getToken() {
  await axios.get('http://192.168.8.1/api/webserver/token')
  .then(function (response) {
  //  console.log(response.data);
     token =  response.data;
    // return response.data;
  })
  .catch(function (error) {
    // handle error
    console.log(error);
  })
  .then(function () {
    // always executed
  });
}



const template = ['response', {
    token: 'token',
}]

function disconnect(token) {
  axios.defaults.headers.common['__RequestVerificationToken'] = token[0].token;

  axios.post('http://192.168.8.1/api/dialup/mobile-dataswitch', xml)
      .then(function (response) {
        console.log(response.data);
      })
      .catch(function (error) {
        // handle error
        console.log(error);
      })
      .then(function () {
        // always executed
      });
  axios.post('http://192.168.8.1/api/dialup/dial', xml2)
    .then(function (response) {
      console.log(response.data);
    })
    .catch(function (error) {
      // handle error
      console.log(error);
    })
    .then(function () {
      // always executed
    });
    axios.post('http://192.168.8.1/api/device/control', xml3)
      .then(function (response) {
        console.log(response.data);
      })
      .catch(function (error) {
        // handle error
        console.log(error);
      })
      .then(function () {
        // always executed
      });
}

;(async function () {
//
   await getToken();
  //console.log('token', token);
   const result = await transform(token, template)
  //     console.log(result)
  await disconnect(result)
})()
