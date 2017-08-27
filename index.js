var request = require('request');
var fs = require('fs');

const folderName= process.argv[2];
const username= process.argv[3];
const password= process.argv[4];
const dirName = process.argv[5];
if (!dirName.endsWith("/")) {
  dirName = dirName+"/";
}

var token = '';
function tratarDownload(scanId) {
  const tratar = (error, response, body) => {
    fs.writeFile(dirName+scanId+'.nessus', body, function (err) {
      if (err) throw err;
        console.log('File '+scanId+' Saved!');
    }); 
  }
  return tratar;
}

function esperarDownload(fileToken, scanId, file) {
  const esperar = (error, response, body) => {
    //console.log('ESPERAR: ',body,'   -- from: ',scanId, '   -- file: ', file);
    if (body.status === 'ready') {
      var options = {
        method: 'get',
        json: true,
        rejectUnauthorized: false,
        url: 'https://localhost:8834/scans/exports/'+fileToken+'/download',
        headers: {
         'X-Cookie': 'token='+token,
        }
      };
      request(options, tratarDownload(scanId));
    } else {
      var options = {
        method: 'get',
        json: true,
        rejectUnauthorized: false,
        url: 'https://localhost:8834/scans/'+scanId+'/export/'+file+'/status',
        headers: {
         'X-Cookie': 'token='+token,
        }
      };
      setTimeout(function(){
        request(options, esperarDownload(fileToken, scanId, file));
      }, 1000);
    
    }
  }
  return esperar;
}

function tratarExport(scanId) {

  const tratar = (error, response, body) => {
    //console.log('EXPORT: ',body, ' -- from ID: ',scanId);
    var options = {
      method: 'get',
      json: true,
      rejectUnauthorized: false,
      url: 'https://localhost:8834/scans/'+scanId+'/export/'+body.file+'/status',
      headers: {
        'X-Cookie': 'token='+token,
      }
    };
    setTimeout(function(){
      request(options, esperarDownload(body.token, scanId, body.file));
    }, 1000);
  }
  return tratar;
}

function getScans(error, response, body) {
  //console.log('FOLDERS: ',body);
  var folder = null;
  body.folders.forEach(function(aux){
    if (aux.name === folderName) {
      folder = aux;
    }
  });
  if (folder) {
    body.scans.forEach(function(aux){
      if (aux.folder_id === folder.id) {
	var options = {
          method: 'post',
          json: true,
          rejectUnauthorized: false,
          url: 'https://localhost:8834/scans/'+aux.id+'/export',
          headers: {
            'X-Cookie': 'token='+token,
          },
	  body: {format: 'nessus'},
        };
	request(options, tratarExport(aux.id));
      }
    });
  }
}

var options = {
  method: 'post',
  body: {username: username, password: password},
  json: true,
  rejectUnauthorized: false,
  url: 'https://localhost:8834/session'
}
request(options, function(error, response, body) {
  if(error) {
    console.log("Error: " + error);
  }
  //console.log('BODY: ',body);
  token = body.token;
  var options = {
    method: 'get',
    json: true,
    rejectUnauthorized: false,
    url: 'https://localhost:8834/scans',
    headers: {
      'X-Cookie': 'token='+body.token,
    }
  };
  request(options, getScans);


});