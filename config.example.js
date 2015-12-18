module.exports = {

	// Amazon information
	email : '',
	client_id : '',
	client_secret : '',
	redirect_uri : '',

	// AES Encryption Key (256-bit)
	key : '',

	// Certificate settings, shared between http and ftp
	ssl : {
		key : 'files/ssl/backup.key',
		cert : 'files/ssl/backup.crt'
	},

	/**
	 * HTTP(s) settings.
	 *
	 * If port is 80 and ssl is enabled/viable, it will automatically bind to 443 instead.
	 */
	http : {
		enabled : true,
		port : 80
	},

	/**
	 * FTP settings.
	 *
	 * The port will always be what you set, even if ssl is enabled.
	 */
	ftp : {
		enabled : true,
		port : 7021
	},

	// Auth users (Admin is just to authorize/sync)
	// Subsections are http, ftp, and global
	// The value could either be an object or string, object matching the following:
	// { password : 'password', root : '/' }
	// root can use the following replacements: {username}, {moment|<DATE FORMAT>}
	auth : {
		global : {
			admin : 'adminpassword123'
		},
		http : {
			// Define your HTTP users here
			SomeUser : {
				password : 'SomePassword123',
				aes : true
			}
		},
		ftp : {
			// Define your FTP users here
			SomeOtherUser : {
				password : 'SomeOtherPassword123',
				root : '/Backup/{username}/{moment|MMMM/DD}/'
			}
		}
	}
};