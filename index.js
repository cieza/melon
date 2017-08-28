var request = require('request');
var fs = require('fs');
var prompt = require('prompt');

/*const folderName= process.argv[2];
const username= process.argv[3];
const password= process.argv[4];
const dirName = process.argv[5];
if (!dirName.endsWith("/")) {
  dirName = dirName+"/";
}*/

var folderName;
var username;
var password;
var dirName;

prompt.start();

prompt.get(['folderName', 'username', 'password', 'dirName'], function (err, result) {
    console.log('Insira as seguintes informacoes:');
    console.log('  folderName: ' + result.folderName);
    console.log('  username: ' + result.username);
    console.log('  password: ' + result.password);
    console.log('  dirName: ' + result.dirName);

    folderName= result.folderName;
    username= result.username;
    password= result.password;
    dirName= result.dirName;

    fazerLogin();
  });

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
  //console.log("error: ",error);
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
	else{
		console.log("Pasta "+folderName+" nao encontrada!");
	}

}

function fazerLogin(){

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


});}
