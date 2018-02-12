var XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;
var unique = require('array-unique');
var read = require('read-file');
const writeFile = require('write-file')

let redweekUrl = 'https://www.redweek.com/resort/P4872-marriotts-aruba-surf-club/rentals?sort-rentals=newest&amp;type=rentals&amp;sort=newest';
var express = require('express');
var server = express();
var server_port = process.env.PORT || 80;
var server_host = '0.0.0.0';
server.listen(server_port, server_host, function() {
    console.log('Listening on port %d', server_port);
});

const accountSid = process.env.accountSid;
const authToken = process.env.authToken;
const client = require('twilio')(accountSid, authToken);

function makeHttpObject() {
  try {return new XMLHttpRequest();}
  catch (error) {}
  try {return new ActiveXObject("Msxml2.XMLHTTP");}
  catch (error) {}
  try {return new ActiveXObject("Microsoft.XMLHTTP");}
  catch (error) {}

  throw new Error("Could not create HTTP request object.");
}

function filterResults(res) {
  let filtered = new Array(res.length)
  filtered = unique(res);
  var oldPostings;
  read('postings.txt', 'utf8', function(err, buffer) {
    var oldPostings = buffer;
    comparePostings(oldPostings,filtered);  
  });

    //stringify newest (unique) postings
    var rawFilteredPostingsString = "";
    filtered.forEach(function(f){
      rawFilteredPostingsString=rawFilteredPostingsString.concat(f+"\r\n");
    })
    //overwrite most recent postings to textfile
    writeFile('postings.txt', rawFilteredPostingsString, function (err) {
      if (err) return console.log(err)
      console.log("Overwrote file")
    })
}

function comparePostings(oldPosts, newPosts) {
  var textMessage = "";
  newPosts.forEach(function(newPost) {
   if(!oldPosts.includes(newPost)){
    textMessage=textMessage.concat("https://www.redweek.com"+newPost+" \r\n")
   }
  });
  if(textMessage!="") {
    console.log(new Date().toLocaleString());
    console.log("Sending text: "+textMessage);
    client.messages.create(
      {
        body: textMessage,
        to: process.env.to,
        from: process.env.from
      },
      (err, message) => {
        process.stdout.write(message.sid);
      }
    );
    client.messages.create(
      {
        body: textMessage,
        to: process.env.to2,
        from: process.env.from
      },
      (err, message) => {
        process.stdout.write(message.sid);
      }
    );
  }
  else{
    console.log(new Date().toLocaleString());
    console.log("no new listings, no text message sent");
  }
}

function runner(){
  console.log(new Date().toLocaleString());
  var request = makeHttpObject();
  request.open("GET", redweekUrl, true);
  request.send(null);
  request.onreadystatechange = function() {
    //gets the regex: /posting/R
    let regex = /\/posting\/R....../g;
    if (request.readyState == 4)
    {
      let rawPostings = request.responseText.match(regex);
      filterResults(rawPostings);
    }
  };
}


//Run it once initially to populate postings.txt
var request = makeHttpObject();
request.open("GET", redweekUrl, true);
request.send(null);
request.onreadystatechange = function() {
  //gets the regex: /posting/R
  let regex = /\/posting\/R....../g;
  if (request.readyState == 4)
  {
    let rawPostings = request.responseText.match(regex);
    let res = rawPostings;
    let filtered = new Array(res.length)
    filtered = unique(res);    
    //stringify newest (unique) postings
    var rawFilteredPostingsString = "";
    filtered.forEach(function(f){
      rawFilteredPostingsString=rawFilteredPostingsString.concat(f+"\r\n");
    })
    //overwrite most recent postings to textfile
    writeFile('postings.txt', rawFilteredPostingsString, function (err) {
      if (err) return console.log(err)
      console.log(rawFilteredPostingsString)
      console.log("Populating postings.txt")
    });
  }
};
//runs program once a minute
setInterval(function() {
  runner();
  var request = makeHttpObject();
  request.open("GET", process.env.appURL, true);
}, 300000);





  


