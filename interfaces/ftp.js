var ftpd = require('ftpd');

var util = require('../util');

module.exports = function(config, CloudDrive, account) {
	console.log('Enabling FTP...');
	var fs = require('fs'),
		server,
		options = {
			host: '127.0.0.1',
			port: 7002,
			tls: null
		};

	if (fs.existsSync(config.ssl.key) && fs.existsSync(config.ssl.cert)) {
		console.log('[FTP] Running as secure ftp server.');
		options.tls = {
			key: fs.readFileSync(config.ssl.key),
			cert: fs.readFileSync(config.ssl.cert),
			// These are just the "recommended" ciphers, I've found that these won't work in Filezilla, but work fine for lftp.
			ciphers: 'ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-ECDSA-AES256-GCM-SHA384:DHE-RSA-AES128-GCM-SHA256:DHE-DSS-AES128-GCM-SHA256:kEDH+AESGCM:ECDHE-RSA-AES128-SHA256:ECDHE-ECDSA-AES128-SHA256:ECDHE-RSA-AES128-SHA:ECDHE-ECDSA-AES128-SHA:ECDHE-RSA-AES256-SHA384:ECDHE-ECDSA-AES256-SHA384:ECDHE-RSA-AES256-SHA:ECDHE-ECDSA-AES256-SHA:DHE-RSA-AES128-SHA256:DHE-RSA-AES128-SHA:DHE-DSS-AES128-SHA256:DHE-RSA-AES256-SHA256:DHE-DSS-AES256-SHA:DHE-RSA-AES256-SHA:!aNULL:!eNULL:!EXPORT:!DES:!RC4:!3DES:!MD5:!PSK'
		};
	} else {
		console.log('[FTP] WARNING! Running as an insecure ftp server. Please upload an ssl certificate.');
	}

	server = new ftpd.FtpServer(options.host, {
		getInitialCwd: function () {
			return '/';
		},
		getRoot: function () {
			return '/';
		},
		pasvPortRangeStart: 1025,
		pasvPortRangeEnd: 1050,
		tlsOptions: options.tls,
		allowUnauthorizedTls: true,
		useWriteFile: false,
		useReadFile: false,
		logLevel: 0
	});

	server._logIf = function() {};

	server.on('error', function (error) {
		console.log('FTP Server error:', error);
	});

	var CDFS = new require('../clouddrive/fs');

	server.on('client:connected', function (connection) {
		var username = null;

		connection.once('command:user', function (user, success, failure) {
			if (util.userExists('ftp', user)) {
				username = user;
				success();
			} else {
				failure();
			}
		});

		connection.once('command:pass', function (pass, success, failure) {
			var opts;
			if (opts = util.validateUser('ftp', username, pass)) {
				success(username, new CDFS(config, CloudDrive, account, util.pathFor('ftp', username), opts));
			} else {
				failure();
			}
		});
	});

	server.listen(options.port);
	console.log('[FTP] Listening on port ' + options.port);
};