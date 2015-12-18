var Request = require('request');
var Url = require('url');

/**
 * NOTE! Both of the functions in this file were taken out of clouddrive-node.
 * They were replaced with ones that allow us to specify a redirect uri.
 *
 * @param Account
 * @param redirect_uri
 */
module.exports = function(Account, redirect_uri) {
	Account.prototype.renewAuthorization = function(callback) {
		var self = this;
		var retval = {
			success: false,
			data: {}
		};

		if (!self.clientId || !self.clientSecret) {
			Request.get('https://data-mind-687.appspot.com/clouddrive?refresh_token=' + self.token.refresh_token, function(err, response, body) {
				if (err) {
					return callback(err);
				}

				retval.success = true;
				retval.data = JSON.parse(body);
				retval.data.last_authorized = Date.now();

				return callback(null, retval);
			});
		} else {
			Request.post('https://api.amazon.com/auth/o2/token', {
				form: {
					grant_type: 'refresh_token',
					refresh_token: self.token.refresh_token,
					client_id: self.clientId,
					client_secret: self.clientSecret,
					redirect_uri: redirect_uri
				}
			}, function(err, response, body) {
				if (err) {
					return callback(err);
				}

				retval.data = JSON.parse(body);
				if (response.statusCode === 200) {
					retval.success = true;
					retval.data.last_authorized = Date.now();
				}

				return callback(null, retval);
			});
		}
	};

	Account.prototype.requestAuthorization = function(redirectUrl, callback) {
		var self = this;
		var retval = {
			success: false,
			data: {}
		};

		var url = Url.parse(redirectUrl, true);
		if (url.query.code === undefined) {
			return callback(new Error('No authorization code found in callback URL: ' + redirectUrl));
		}

		Request.post('https://api.amazon.com/auth/o2/token', {
			form: {
				grant_type: 'authorization_code',
				code: url.query.code,
				client_id: self.clientId,
				client_secret: self.clientSecret,
				redirect_uri: redirect_uri
			}
		}, function(err, response, body) {
			if (err) {
				return callback(err);
			}

			retval.data = JSON.parse(body);
			if (response.statusCode === 200) {
				retval.success = true;
				retval.data.last_authorized = Date.now();
			}

			return callback(null, retval);
		});
	};
};