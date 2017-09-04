var request = require('request');
var fs = require('fs');
var prompt = require('prompt');
var readline = require('readline-sync');
var uuid = require('uuid/v4');
var fs = require('fs');

const filePath = process.argv[2];
/*
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
var policyId;
var folderId;

var token = '';



function scanCreated(error, response, body) {
  console.log('Created scan body: ',body);
  console.log('Created scan error: ',error);
}

function createScan(ip) {
  const uid = uuid();
  console.log('uid: ',uid);
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
      url: 'https://localhost:8834/scans/',
      headers: {
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
  const num = readline.question("Escolha um folder (digite o numero):\n");
  folderId = body.folders[parseInt(num,10)-1].id;
  console.log('folderId: ',folderId);
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
  console.log('POlicyID: ',policyId);
  var options = {
    method: 'get',
    json: true,
    rejectUnauthorized: false,
    url: 'https://localhost:8834/folders',
    headers: {
      'X-Cookie': 'token='+token,
    }
  }
  request(options, listFolders);
  
}

function requisicaoNessus(error, response, body){  
  //console.log("Veja aqui o body: " , body);
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
      url: 'https://localhost:8834/policies',
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
    url: 'https://localhost:8834/session'
  }
  request(options, requisicaoNessus);
}

function solicitarDados(){
  username = readline.question("Usuario do Nessus:\n");
  password = readline.question("Senha do Nessus:\n"); 
  
  fazerLogin();
}

solicitarDados();
 
