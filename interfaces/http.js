var express = require('express'),
	app = express(),
	multer = require('multer'),
	upload = multer({ dest: 'files/uploads/' }),
	fs = require('fs'),
	crypto = require('crypto'),
	moment = require('moment'),
	http = require('http'),
	https = require('https');

var util = require('../util');

module.exports = function(config, CloudDrive, account) {
	console.log('Enabling HTTP...');
	var basicAuth = require('basic-auth');

	var Node = CloudDrive.Node;

	var auth = function (req, res, next) {
		function unauthorized(res) {
			res.set('WWW-Authenticate', 'Basic realm=Authorization Required');
			return res.sendStatus(401);
		};

		var user = basicAuth(req);

		if (!user || !user.name || !user.pass) {
			return unauthorized(res);
		};

		var opts;
		if (opts = util.validateUser('http', user.name, user.pass)) {
			req.auth = {
				username : user.name,
				password : user.pass,
				opts : opts
			};
			return next();
		} else {
			return unauthorized(res);
		};
	};

	app.use(auth);

	app.get('/sync', function(req, res) {
		account.sync(function(err, data) {
			res.send(err ? err.toString() : 'success');
		});
	});

	app.get('/authorize', function(req, res) {
		account.authorize(req.query.code ? 'http://localhost:3000' + req.originalUrl : null, function(err, data) {
			if (data.success) {
				res.send('Already authorized');
				return;
			}

			if (data.data.auth_url) {
				var auth_url = data.data.auth_url;

				auth_url = auth_url.replace(/redirect_uri=(.*)/, 'redirect_uri=' + config.redirect_uri);

				res.redirect(auth_url);
			} else {
				res.json(data);
			}
		});
	});

	app.post('/upload', upload.single('file'), function(req, res) {
		if (!req.file || !req.file.originalname.match(/([a-zA-Z0-9_\-\.]+)/)) {
			res.send('Invalid file name');
			return;
		}

		var localPath = 'files/encrypt/' + req.file.originalname;

		var input = fs.createReadStream(req.file.path);

		if (req.auth.opts.aes) {
			localPath += '.enc';

			var cipher = crypto.createCipher('aes-256-cbc', config.key);
			input = input.pipe(cipher);
		}

		var output = fs.createWriteStream(localPath);

		input.pipe(output);

		output.on('finish', function() {
			fs.unlinkSync(req.file.path);

			var path = util.pathFor('http', req.auth.username);

			account.authorize(null, function(err, data) {
				if (err) {
					res.send('error: ' + data.data.message);
					return;
				}

				// Upload it to cloud drive
				Node.uploadFile(localPath, path, {}, function(err, data) {
					// Remove encrypted file
					fs.unlinkSync(localPath);

					if (err) {
						console.log(err);
						res.send('error: ' + err.toString());
						return;
					}

					// Check response
					if (!data.success) {
						res.send('error: ' + data.data.message);
					} else {
						res.send('ok');
					}
				});
			});
		});
	});

	if (fs.existsSync(config.ssl.key) && fs.existsSync(config.ssl.cert)) {
		var server = https.createServer({
			key : fs.readFileSync(config.ssl.key),
			cert : fs.readFileSync(config.ssl.cert)
		}, app);

		var port = config.http.port == 80 ? 443 : config.http.port;

		server.listen(port, function() {
			console.log('[HTTP] Listening on port ' + port + ' (secure)');
		});
	} else {
		console.log('[HTTP] WARNING! Running as an insecure http server. Please upload an ssl certificate.');

		var server = http.createServer(app);

		server.listen(config.http.port, function() {
			console.log('[HTTP] Listening on port ' + config.http.port);
		});
	}
};