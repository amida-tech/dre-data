var factory = require('./lib/client');

/**
 * get a client object.  The reason I do it as a prototype is so that I can later surface authentication 
 * mechanisms on a per client instance basis.  It also allows us to have multiple clients pointing to 
 * different servers should that ever be needed for some bizarre reason.
 */
exports.getClient = function(url) {
	return factory.getClient(url);
}