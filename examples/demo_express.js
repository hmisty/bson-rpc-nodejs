var util = require('util');
var bson_rpc = require('..');
var express = require('express');
var app = express();

var proxy = new bson_rpc.client('127.0.0.1', 8181);
proxy.use_service(['add']);

proxy.connect();

app.get('/', function (req, res) {
	res.send('<ul>' +
					 '<li><a href=/1>1</a></li>' +
					 '<li><a href=/2>2</a></li>' +
					 '<li><a href=/3>3</a></li>' +
					 '<li><a href=/4>4</a></li>' +
					 '</ul>');
});

app.get('/1', function (req, res) {
	proxy.on_result(proxy.add(1, 2), function (err, doc) {
		res.send(JSON.stringify(doc));
	});
});

app.get('/2', function (req, res) {
	proxy.on_result(proxy.add(3, 4), function (err, doc) {
		res.send(JSON.stringify(doc));
	});
});

app.get('/3', function (req, res) {
	proxy.on_result(proxy.add(5, 6), function (err, doc) {
		res.send(JSON.stringify(doc));
	});
});

app.get('/4', function (req, res) {
	proxy.on_result(proxy.add(7, 8), function (err, doc) {
		res.send(JSON.stringify(doc));
	});
});

var server = app.listen(3000, function () {
	var host = server.address().address;
	var port = server.address().port;

	console.log('Example app listening at http://%s:%s', host, port);
});
