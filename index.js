'use strict';

var config = require('./config'),
	CloudDrive = require('clouddrive');

const Account = CloudDrive.Account,
		Node = CloudDrive.Node;

require('./clouddrive/AccountOverride')(Account, config.redirect_uri);

var account;

var SQLite = CloudDrive.Cache.SQLite;
new SQLite({
	client: 'sqlite3',
	connection: {
		filename: 'cache/' + config.email + '.db'
	}
}, function(err, cache) {
	account = new Account(config.email, config.client_id, config.client_secret, cache);
	Node.init(account, cache);

	account.load(function(err) {
		if (err) {
			console.log('Load error', err);
			return;
		}

		account.authorize(null, function(err, data) {
			if (err) {
				console.log('Auth error', err);
				return;
			}

			if (config.http.enabled) {
				require('./interfaces/http')(config, CloudDrive, account);
			}

			if (config.ftp.enabled) {
				require('./interfaces/ftp')(config, CloudDrive, account);
			}
		});
	});
});