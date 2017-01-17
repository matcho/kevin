var Joi = require('joi');

// -------------------------------------------------

var env = require('../env.json');

// -------------------------------------------------

module.exports.api_cache_name = 'cache_example';
module.exports.cache_example = function (req, next) {
	// params parameters
	var p = req.params['p'];

	// query parameters
	var q = req.query['q'] || null;

	// custom error
	var custom_error = {
		statusCode: 400,
		error: 'Error',
		message: 'An error occurred while loading data'
	};

	next(null, { p: p, q: q });

	//next(error, body);
};
module.exports.api_cache_function = module.exports.cache_example;

// -------------------------------------------------

module.exports.route = {
	method: 'GET',
	path: '/example/{p}',
	handler: function (request, reply) {

		request.server.methods.cache_example({ params: request.params, query: request.query }, function (error, result) {
			if (error) {
				if ('statusCode' in error) {
					reply(error).code(error.statusCode);
				} else {
					reply(error);
				}
			} else {
				reply(result);
			}
		});
	},
	config: {
		tags: ['api'],
		description: 'This an example, baby !',
		notes: 'Oh yeah !',
		validate: {
			params: {
				p: Joi.number()
					.required()
					.description('the P parameter')
			},
			query: {
				q: Joi.string()
					.optional()
					.default('lolilol')
					.description('the Q parameter')
			}
		},
		cache: {
			expiresIn: 1000 * 60,
			privacy: 'private'
		}
	}
};