var fs = require('fs'),
	Path = require('path'),
	crypto = require('crypto'),
	eventsIntercept = require('events-intercept');

module.exports = function(config, CloudDrive, account, opts) {
	var Node = CloudDrive.Node;

	function fixPath(path) {
		path = Path.join(opts.root || '/', path);
		path = path.replace(/\\/g, '/');
		path = path.replace(/\/\.(=\/)|^\./|/\.?$/, '');
		path = path.replace(/\/*[^\/\.]+\/\.\./g, '');
		return path;
	}

	var NodeStat = function(node) {
		this.node = node;

		this.mtime = new Date(node.modifiedDate);
		this.size = this.isDirectory() ? 0 : node.contentProperties.size;
	};

	NodeStat.prototype.isFile = function() {
		return this.node.isFile();
	};

	NodeStat.prototype.isDirectory = function() {
		return this.node.isFolder();
	};

	return {
		readdir : function(dir, callback) {
			dir = fixPath(dir);

			Node.loadByPath(dir, function(err, node) {
				if (err) {
					callback(err);
					return;
				}

				node.getChildren(function(err, children) {
					var names = [];
					children.forEach(function(child) {
						if (child.inTrash()) {
							return;
						}

						names.push(child.data.name);
					});
					callback(err, names);
				});
			});
		},
		stat : function(path, callback) {
			path = fixPath(path);

			Node.loadByPath(path, function(err, node) {
				if (!node) {
					callback(new Error('File does not exist.'));
					return;
				}
				callback(err, new NodeStat(node.data));
			});
		},
		open : function(path, flags, mode, callback) {
			if (typeof mode == 'function') {
				callback = mode;
			}
			path = fixPath(path);

			callback(new Error('Cannot read from path, not supported'));

			// TODO this could work, and auto decrypt, but we should probably have permissions and also remove the file afterwards.
			/*
			Node.loadByPath(path, function(err, node) {
				if (err) {
					callback(err);
					return;
				}

				node.download('files/uploads/', {}, function(err, data) {
					fs.open('files/uploads/' + node.getName(), flags, mode, callback);
				});
			});*/
		},
		unlink : function(path, callback) {
			path = fixPath(path);

			Node.loadByPath(path, function(err, node) {
				if (err) {
					callback(err);
					return;
				}
				node.trash(callback);
			});
		},
		mkdir : function(path, mode, callback) {
			path = fixPath(path);

			if (typeof mode == 'function') {
				callback = mode;
			}

			Node.createDirectoryPath(path, function(err, data) {
				callback(err);
			});
		},
		rmdir : function(path, callback) {
			path = fixPath(path);

			Node.loadByPath(path, function(err, node) {
				if (err) {
					callback(err);
					return;
				}
				node.trash(callback);
			});
		},
		rename : function(path, newPath, callback) {
			path = fixPath(path);
			newPath = fixPath(path);

			Node.loadByPath(path, function(err, node) {
				if (Path.dirname(path) == Path.dirname(newPath)) {
					// Rename
					node.rename(newPath, function(err) {
						callback(err);
					});
				} else {
					// Move
					var newDir = Path.dirname(newPath);

					Node.createDirectoryPath(newDir, function(err, newNode) {
						if (err) {
							callback(err);
							return;
						}

						newNode = newNode.data;

						node.move(newNode, function(err) {
							callback(err);
						});
					})
				}
			});
		},
		createWriteStream : function(path) {
			path = fixPath(path);

			var localPath = 'files/uploads/' + Path.basename(path);

			if (opts.aes) {
				localPath += '.enc';
			}

			var fileStream = fs.createWriteStream(localPath);

			if (opts.aes || opts.key) {
				var cipher = crypto.createCipher('aes-256-cbc', opts.key || config.key);
				fileStream = cipher.pipe(fileStream);
			}

			eventsIntercept.patch(fileStream);

			fileStream.intercept('finish', function(done) {
				account.authorize(null, function(err, data) {
					// Upload it to cloud drive
					Node.uploadFile(localPath, Path.dirname(path), {}, function(err, res) {
						// Remove encrypted file
						fs.unlinkSync(localPath);

						if (err || !res.success) {
							fileStream.emit('error', err || new Error(res.data.message));
							return;
						}

						done(null);
					});
				});
			});

			return fileStream;
		},
		createReadStream : function(path, options) {
			return fs.createReadStream(path, options);
		}
	};
};