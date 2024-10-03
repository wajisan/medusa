var https = require('https');
var http = require('http');

var app = http.createServer(response);
var fs = require('fs');
var io = require('socket.io')(app);
app.listen(3001);
console.log("App running...");
function response(req, res) {
    var file = "";
    if (req.url == "/") {
        file = __dirname + '/index.html';
    } else {
        file = __dirname + req.url;
    }
    fs.readFile(file, function(err, data) {
        if (err) {
            res.writeHead(404);
            return res.end('Page or file not found');
        }
    res.writeHead(200);
        res.end(data);
    });
}

io.on("connection", function(socket) {

    socket.on("send message", function(data, callback) {
        var ret = '';
        if (data.url.includes('http:')) {
			ret = getStatus(data, http, '', socket);
		}
		else if (data.url.includes('https:')) {
			ret = getStatus(data, https, '', socket);
		}
		else{
			data.msg = 'invalid url format';
			io.to(socket.id).emit("update messages", data);
		}
		callback();
    });
});

function getStatus(data, lib, log, socket) {
	var url = data.url;
	var chat = '';
	if (url.includes('http:'))
		lib = http;
	else
		lib = https;	
	lib.get(url, function(res) {
		if (res.statusCode != undefined && res.statusCode.toString().charAt(0) == '2'){
			chat = log + '\n' + url + ' [' + res.statusCode + '] : OK';
		}
	  	else if (res.statusCode != undefined && res.statusCode.toString().charAt(0) == '3'){
	  		if (res.headers != undefined && res.headers.location != undefined){
	  			data.url = res.headers.location;
	  			getStatus(data, lib, log + '\n' + url + ' [' + res.statusCode + '] : redirection to ' + res.headers.location, socket);
	  		}
	  	}
	  	else if (res.statusCode != undefined && res.statusCode.toString().charAt(0) == '4'){
	  		chat = log + '\n' + url + ' [' + res.statusCode + '] : Client error';
	  	}
	  	else if (res.statusCode != undefined && res.statusCode.toString().charAt(0) == '5'){
	  		chat = log + '\n' + url + ' [' + res.statusCode + '] : Server error';
	  	}
	  	var dat = {
	  		msg: chat,
	  		url: url,
	  		id: data.id,
	  		code: res.statusCode
	  	}
		io.to(socket.id).emit("update messages", dat);

	}).on('error', function(e) {
		data.msg = e;
		data.code = '500';
		io.to(socket.id).emit("update messages", data);
	  return log + ' ' + e;
	});
}


