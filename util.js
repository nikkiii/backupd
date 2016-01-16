var config = require('./config'),
	moment = require('moment');

module.exports = {
	userExists : function(type, username) {
		return username in config.auth.global || username in config.auth[type];
	},

	validateUser : function(type, username, password) {
		if (!(username in config.auth.global) && !(username in config.auth[type])) {
			return false;
		}

		var obj = config.auth.global[username] || config.auth[type][username];

		if (obj.password != password) {
			return false;
		}

		if (!('root' in obj)) {
			obj.root = '/';
		}

		return obj;
	},

	pathFor : function (type, username) {
		if (!(username in config.auth.global) && !(username in config.auth[type])) {
			return null;
		}

		var obj = config.auth.global[username] || config.auth[type][username];

		if (typeof obj != 'object' || !('root' in obj)) {
			return '/';
		}

		var path = obj.root;

		path = path.replace(/\{username\}/, username);
		path = path.replace(/\{moment\|(.*?)\}/, function(match) {
			return moment().format(match[1]);
		});

		return path;
	}
};