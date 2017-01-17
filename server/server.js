const Hapi = require('hapi');
var async = require('async');

var env = require('./env.json');
var pack = require('./package.json');
var api = require('./api/api.json');
var static = require('./static/static.json');

// Server configuration
var server = new Hapi.Server({
	cache: require('catbox-redis')
});
server.connection({ port: env.port });

var start_server = function () {
	async.series([
		function (callback) {
			load_hapi_swagger(callback);
		},
		function (callback) {
			// Lab (test utility) doesn't need a running server
			if (!module.parent) {
				load_good_console(callback);
			} else {
				callback();
			}
		},
		function (callback) {
			load_static_server(callback);
		},
		function (callback) {
			load_routes(callback);
		}
	], function (error) {
		if (!error) {
			// Lab (test utility) doesn't need a running server
			if (!module.parent) {
				// Start server
				server.start(function () {
					server.log('info', 'Server running at: ' + server.info.uri);
				});
			}
		}
	});
};

var load_routes = function (callback) {
	var SECOND = 1000;
	var MINUTE = 60 * SECOND;
	// Routes
	for (var i = 0; i < api.config.length; i++) {
		var ressource = require('./api/' + api.config[i] + '.js');
		server.route(ressource.route);

		if (ressource.api_cache_name && ressource.api_cache_function) {
			server.method(ressource.api_cache_name, ressource.api_cache_function, {
				cache: {
					expiresIn: env.cache_expiration_in_minutes * MINUTE,
					generateTimeout: 60 * SECOND
				},
				generateKey: function(opts) {
					return JSON.stringify(opts);
				}
			});
		}
	}

	for (var i = 0; i < static.config.length; i++) {
		var ressource = require('./static/' + static.config[i] + '.js');
		server.route(ressource.route);
	}

	console.log(['start'], 'Routes loaded');
	callback();
}

var load_hapi_swagger = function (callback) {
	// API documentation
	var swagger_options = {
		host: ((env.api_host != null && env.api_host != '') ? env.api_host : server.info.host + ':' + server.info.port ),
		documentationPath: '/',
		info: {
			title: pack.name,
			description: pack.description
		}
	};

	// Register HapiSwagger
	server.register([
		require('inert'),
		require('vision'),
		{ register: require('hapi-swagger'), options: swagger_options }
	], function (error) {
		if (error) {
			console.log(['error'], 'Plugin "hapi-swagger" load error: ' + error);
		} else {
			console.log(['start'], 'Swagger interface loaded');
		}
		callback(error);
	});
}

var load_good_console = function (callback) {
	// Register Good & Good Console
	server.register({
		register: require('good'),
		options: {
			reporters: {
				console: [{
					module: 'good-squeeze',
					name: 'Squeeze',
					args: [{
						response: '*',
						log: '*'
					}]
				}, {
					module: 'good-console'
				}, 'stdout']
			}
		}
	}, function (error) {
		if (error) {
			console.log(['error'], 'Plugin "good / good-console" load error: ' + error);
		} else {
			console.log(['start'], 'Good & Good Console loaded');
		}
		callback(error);
	});
}

var load_static_server = function (callback) {
	server.register({
		register: require('inert'),

	}, function (error) {
		if (error) {
			console.log(['error'], 'Static server load error: ' + error);
		} else {
			console.log(['start'], 'Static server loaded');
		}
		callback(error);
	});
}

start_server();

// Expose server for Lab
module.exports = server;