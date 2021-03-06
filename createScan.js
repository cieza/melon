//Author: ECieza

var request = require('request');
var fs = require('fs');
var prompt = require('prompt');
var readline = require('readline-sync');
var fs = require('fs');

const filePath = process.argv[2];

var folderName;
var username;
var password;
var dirName;
var policyId;
var folderId;
var IP = `localhost`;

var token = '';
var XAPIToken = '';


function scanCreated(error, response, body) {
    if(body.scan) {
    console.log('Created scan: '+body.scan.name);
    } else {
    console.log('Error on create scan: ', body);
    }
}

function createScan(ip) {
  const body = {uuid: 'ab4bacd2-05f6-425c-9d79-3ba3940ad1c24e51e1f403febe40',
    settings: {
      name: 'Scan do ip '+ip,
      folder_id: folderId,
      policy_id: policyId,
      text_targets: ip,
      launch: 'ONETIME',
      enabled: false,
      launch_now: false,
      emails: '',
      filter_type: '',
      filters: []}};

    var options = {
      method: 'post',
      json: true,
      rejectUnauthorized: false,
      url: 'https://'+IP+':8834/scans/',
      headers: {
        'X-API-Token': XAPIToken,
        'X-Cookie': 'token='+token,
      },
      body: body,
    };
    request(options, scanCreated);
}

function listFolders(error, response, body) {
  let i = 1;
  body.folders.forEach((folder) => {
    console.log(i+" - "+folder.name);
    i = i + 1;
  });
  const num = readline.question("Escolha uma pasta (digite o numero):\n");
  folderId = body.folders[parseInt(num,10)-1].id;
  fs.exists(filePath, function(exists){
   if(exists){ // results true
      fs.readFile(filePath, {encoding: "utf8"}, function(err, data){
         if(err){
            console.log(err);
            return;
         }
         const lines = data.toString().split('\n');
         lines.forEach((line) => {
           createScan(line);
         });

      })
   }
  });

}

function listPolicies(error, response, body) {
  let i = 1;
  body.policies.forEach((policie) => {
    console.log(i+" - "+policie.name);
    i = i + 1;
  });
  const num = readline.question("Escolha uma policy (digite o numero):\n");
  policyId = body.policies[parseInt(num,10)-1].id;
  var options = {
    method: 'get',
    json: true,
    rejectUnauthorized: false,
    url: 'https://'+IP+':8834/folders',
    headers: {
      'X-Cookie': 'token='+token,
    }
  }
  request(options, listFolders);

}

function requisicaoNessus(error, response, body){
  if(body.error=="Invalid Credentials") {
    console.log("Falha ao realizar Login no Nessus, insira novamente as credencias: ");
    solicitarDados();
  }
  else{
    token = body.token;
    var options = {
      method: 'get',
      json: true,
      rejectUnauthorized: false,
      url: 'https://'+IP+':8834/policies',
      headers: {
        'X-Cookie': 'token='+body.token,
      }
    }
    request(options, listPolicies);
  }
}

function fazerLogin(){
  var options = {
    method: 'post',
    body: {username: username, password: password},
    json: true,
    rejectUnauthorized: false,
    url: 'https://'+IP+':8834/session'
  }
  request(options, requisicaoNessus);
}

function solicitarDados(){
  username = readline.question("Usuario do Nessus:\n");
  password = readline.question("Senha do Nessus:\n", {hideEchoBack: true});
  IP = readline.question("IP do Nessus:\n");
  XAPIToken = readline.question("X-API-Token:\n");

  fazerLogin();
}

solicitarDados();
