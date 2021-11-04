const fs = require('fs');
const { parse } = require('json2csv');
const axios = require('axios');
var convert = require('xml-js');
const { transform, prettyPrint } = require('camaro')
const SocksProxyAgent = require('socks-proxy-agent');
var https = require('https');


//const lteXML = '<?xml version: "1.0" encoding="UTF-8"?><request><NetworkMode>0302</NetworkMode><NetworkBand>3FFFFFFF</NetworkBand><LTEBand>800C5</LTEBand></request>';
const lteXML =  '<?xml version: "1.0" encoding="UTF-8"?><request><NetworkMode>03</NetworkMode><NetworkBand>3FFFFFFF</NetworkBand><LTEBand>7FFFFFFFFFFFFFFF</LTEBand></request>'
const hspaXML =  '<?xml version: "1.0" encoding="UTF-8"?><request><NetworkMode>02</NetworkMode><NetworkBand>3FFFFFFF</NetworkBand><LTEBand>7FFFFFFFFFFFFFFF</LTEBand></request>'
//const hspaXML = '<?xml version: "1.0" encoding="UTF-8"?><request><NetworkMode>02</NetworkMode><NetworkBand>3FFFFFFF</NetworkBand><LTEBand>800C5</LTEBand></request>';

const tokenSchema = ['response', {
    token: 'TokInfo',
    SesInfo:'SesInfo'
}]
const infoMobileSchema = ['response', {
    productFamily: 'ProductFamily',
}]
const monitoringSchema = ['response', {
    wanipaddress: 'WanIPAddress',
    connectionstatus: 'ConnectionStatus',
    currentnetworktype: 'CurrentNetworkType'
}]

const modems = [
  {
    ip: 'http://192.168.11.1',
    time: 600000,
    log: 'onlyReplace'
  }
]




function start(modems) {
  let modem = modems.ip;

  let token = '';
  let statusInfo = '';
  let ip = '';
  let type = '';

async function getToken() {
  await axios.get(modem + '/api/webserver/SesTokInfo')
  .then(function (response) {
     token =  response.data;
  })
  .catch(function (error) {

    console.log(error);
  })
  .then(function () {
  });
}


async function checkIP() {

}


async function onLTE() {
  await updateToken();
  let resultToken = await transform(token, tokenSchema);
  if (log == 'logAll') {
    console.log(resultToken);
  }
  axios.defaults.headers.common['__RequestVerificationToken'] = resultToken[0].token;
  axios.defaults.headers.common['Cookie'] = resultToken[0].SesInfo;
  await axios.post(modem + '/api/net/net-mode', lteXML)
    .then(async function (response) {
    //  console.log('LTE активирован, идет смена на 3g, ждем 10 сек');
      setTimeout(async ()=> { changeTimeActiveted('lte')}, 6000)
    })
    .catch(function (error) {
      // handle error
      console.log(error);
    })
    .then(function () {
      // always executed
    });
}

async function on3g() {
  if (log == 'logAll'||log == 'onlyReplace') {
    console.log('Запускаю 3g на модеме '+  + modem);
  }
  await updateToken();
  let resultToken = await transform(token, tokenSchema);
  if (log == 'logAll') {
    console.log('resultToken', resultToken);
  }
  axios.defaults.headers.common['__RequestVerificationToken'] = resultToken[0].token;
  axios.defaults.headers.common['Cookie'] = resultToken[0].SesInfo;
  if (log == 'logAll') {
    console.log('token[0]', token[0]);
    console.log('3 g до сюда работает');
  }
  await axios.post(modem + '/api/net/net-mode', hspaXML)
    .then(async function (response) {
      if (log == 'logAll') {
        console.log('3g активирован, идет смена на LTE, ждем 10 сек');
        console.log('3g статус', response.data);
      }
      setTimeout(async ()=> { changeTimeActiveted('hspa')}, 6000)

    })
    .catch(function (error) {
      // handle error
      console.log(error);
    })
    .then(function () {
      // always executed
    });
}
async function changeTimeActiveted(typeInternet) {
//  console.log('changeTimeActiveted');
  if (typeof typeInternet != undefined) {
      type = typeInternet;
  }
  else typeInternet = type;
  await updateToken();
  let resultToken = await transform(token, tokenSchema)
  await monitoringInfo(resultToken);
  if (log == 'logAll') {
    console.log("Парсинг статус инфо", statusInfo);
  }
  let result =  await transform(statusInfo, monitoringSchema)
  if (log == 'logAll') {
    console.log("statusInfo = ", result[0]);
  }
  if (result[0].connectionstatus==900||result[0].connectionstatus==901) {
    if (log == 'logAll') {
      console.log('работаем result.connectionstatus= '+ result[0].connectionstatus);
    }
    if (typeInternet=='lte') {
    //  console.log('Начинается новый цикл LTE');
      //await checkIP();
      if (log == 'logAll'||log == 'onlyReplace') {
        console.log("Отдых между циклом на модеме "+ modem+". Отдых составляет "+ timeChange +" мс");
      }
      setTimeout(on3g, timeChange)
    }
    else if (typeInternet=='hspa') {
      await onLTE(token)
    }
  }
  else if(result[0].connectionstatus==902||result[0].connectionstatus==901) {
    //console.log('result.connectionstatus==902');
    waiting(typeInternet);
  }
  else {
    console.log('ОШИБКА, connectionstatus =' + result[0].connectionstatus);
  }
}
function waiting (typeInternet) {
  //console.log('ждем 3 секунды для проверки статуса');
  setTimeout(async ()=> { changeTimeActiveted(typeInternet)}, 3000)
}

async function chengeIP(token) {
  if (log == 'logAll'||log == 'onlyReplace') {
    console.log('Начинаю менять ip на модеме '+  + modem);
  }
  await monitoringInfo(token);
  let result =  await transform(statusInfo, monitoringSchema)
  let currentnetworktype = result[0].currentnetworktype
//  console.log(currentnetworktype);
  if(currentnetworktype==41) {
    await onLTE(token);
  }
  else if(currentnetworktype==46||currentnetworktype==101) {
    await on3g(token);
  }
  else {
    if (log == 'logAll') {
      console.log('Ошибка статуса работы. currentnetworktype = ' + currentnetworktype +  + modem)
    }
    await on3g(token);
  }
}

async function updateToken() {
  await getToken();
  let result = await transform(token, tokenSchema);
  if (log == 'logAll') {
    console.log("очередной апдейт токена "+ result)
  }
}

;(async function () {
  // console.log('Старт программы');
//   await checkIP();
//   console.log('Ваш текущий ip: ' + ip);
   await getToken();

   let result = await transform(token, tokenSchema)
    if (log == 'logAll') {
     console.log('Получение первого токена result updateToken = ' + result);
    }
    chengeIP(result)

})()

};

for (var i = 0; i < modems.length; i++) {
  console.log('отгружаю  ip',modems[i] );
  let b = modems[i]
  setTimeout(function () {
    start(b);
  }, 5000);
}






/*
const xml =
'<?xml version="1.0" encoding="utf-8"?>' +
'<request><dataswitch>' +
'1' +
'</dataswitch></request>';
const xml2 =
'<?xml version: "1.0" encoding="UTF-8"?><request><Action>1</Action></request>';
const xml3 = "<?xml version=\"1.0\" encoding=\"UTF-8\"?><request><Control>1</Control></request>";
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
async function deviceInfo(token) {
  axios.defaults.headers.common['__RequestVerificationToken'] = token[0].token;
  await axios.get('http://192.168.8.1/api/device/information')
  .then(function (response) {
    ;(async function () {
      const result = await transform(response.data, infoMobileSchema)
      console.log(result);
    })()
  })
  .catch(function (error) {
    // handle error
    console.log(error);
  })
  .then(function () {
    // always executed
  });
}
*/
