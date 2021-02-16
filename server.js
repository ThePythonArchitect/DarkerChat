var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var path = require('path');
var Data = require('./Data.js')

//the port the server listens on
const port = 80;
//the client side files are stored in this folder
//this automatically sends the index.html file to client
app.use(express.static('public'));

var data = new Data(io);
//data.verbose = true; //ONLY USE FOR DEBUGGING

function startServer() {
	console.log(`Server started on port: ${port}`);
	console.log();
	return;
}
http.listen(port, startServer);