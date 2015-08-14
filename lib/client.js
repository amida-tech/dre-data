var mkFhir = require('fhir.js');
var prov = require('./provenance');
var trans = require('./transaction');

exports.getClient = function(url) {
	return new Client(url);
}

Client = function(url) {
	this.baseUrl = url;
	this.fhirClient = mkFhir({
		baseUrl : url
	});

}

Client.prototype.search = function(objectType, theQuery, success) {
	// this is a straight passthrough right now.
	this.fhirClient.search({
		type : objectType,
		query : theQuery
	}, function(err, bundle) {
		success(err, bundle);
	});

};

Client.prototype.create = function(bundle, source, success, error, patientId) {
	if (bundle.resourceType === undefined || bundle.resourceType != 'Bundle') {
		// not dealing with a bundle
		if (bundle.resource === undefined) {
			// not dealing with a resource, assume an entry
			// wrap the entry in a resource
			var r = {};
			r.resource = bundle;
			bundle = r;
		} else {
			if (bundle.resource.id !== undefined) {
				// delete the id since it is not allowed for a create.
				delete bundle.resource.id
			}
		}
	} else {
		var r = {};
		r.resource = bundle;
		bundle = r;
	}

	this.fhirClient.create(bundle, function(entry, uri, config) {
		// this assumes history is part of the uri, which I believe to be
		// required but am not certain
		if (uri != null) {
			components = uri.match(/base\/((.*)\/(.*)\/_history\/(.*))/);
			id = components[4];
			reference = components[2];
		} else {
			//??
		}

		if (entry == null) {
			// did not get the response entry so we will build it from what was
			// submitted
			entry = JSON.parse(config.data);
			entry.id = id;
		}

		success(entry, uri, config);
	}, error);
}

Client.prototype.update = function(bundle, source, success, error, patientId) {

}

Client.prototype.createWithProvenance = function(bundle, source, success, error, patientId) {
	var resources = [];
	var entries = [];
	
	
	var rType = bundle.resourceType;
	var id;
	if (bundle.id === undefined){
		id = rType+'/1';
		bundle.id = id;
	}else{
		id = bundle.id;
	}
	
	
	resources.push({
		'reference' : id
	});
	
	//add the submitted object to the transaction
	
	// create a transaction for the object
	var transaction = {
		"resourceType" : "Bundle",
		"entry" : [ {
			"resource" : bundle,
			"transaction" : {
				"method" : "POST",
				"url" : bundle.resourceType
			},
			"base" : "http://localhost:8080/fhir"
		}, {

		}

		]
	};

	var newProvenance = {
			"resource" : {
				"resourceType" : "Provenance",
				"id" : "Provenance/1",
				"target" : resources,
				"agent" : [ {
					"role" : {
						"system" : "http://hl7.org/fhir/provenance-participant-role",
						"code" : "derivation"
					},
					"type" : {
						"system" : "http://hl7.org/fhir/provenance-participant-type",
						"code" : "device"
					},
					"referenceUri" : "http://amida-tech.com/fhir/dre",
					"display" : "Data Reconciliation Engine"

				} ],
				"reason" : "update from DRE"
			},
			"transaction" : {
				"method" : "POST",
				"url" : "Provenance"
			},
			"base" : "http://localhost:8080/fhir"
		};

	//add the provenance to the transaction
	bundle.entry.push(newProvenance);
	
	if (source != null) {
		// should check to see if it is a string
		// since it should always be a string it is debatable if we need to
		// base64 encode it.
		var newBinary = {
			"resource" : {
				"resourceType" : "Binary",
				"id" : "Binary/source",
				"contentType" : "text/plain",
				"content" : btoa(source)
			},
			"transaction" : {
				"method" : "POST",
				"url" : "Binary"
			},
			"base" : "http://localhost:8080/fhir"
		};

		//add the binary file to the provenance
		resources.push({
			"reference" : "Binary/source"
		});
		//add the binary to the transaction
		bundle.entry.push(newBinary);

	}





	// execute transaction
	// assemble response

}

Client.prototype.updateWithProvenance = function(bundle, source, success,
		error, patientId) {

	// create a transaction for the object
	// execute transaction
	// assemble response

}

Client.prototype.transaction = function(bundle, source, success, error) {

	// loop through the bundle and get all objects.
	var hasProvenance = false;
	var resources = [];
	entries = bundle.entry;
	for (var i = 0; i < entries.length; i++) {
		resources.push({
			'reference' : entries[i].resource.id
		});
		if (entries[i].resourceType == 'Provenance') {
			hasProvenance = true;
		}
	}
	console.log(resources);

	// TODO: Make provenance mechanism replacable
	if (!hasProvenance) {
		if (source != null) {
			// should check to see if it is a string
			// since it should always be a string it is debatable if we need to
			// base64 encode it.
			var newBinary = {
				"resource" : {
					"resourceType" : "Binary",
					"id" : "Binary/source",
					"contentType" : "text/plain",
					"content" : btoa(source)
				},
				"transaction" : {
					"method" : "POST",
					"url" : "Binary"
				},
				"base" : "http://localhost:8080/fhir"
			};

			resources.push({
				'reference' : 'Binary/source'
			});
			bundle.entry.push(newBinary);

		}

		var newProvenance = {
			"resource" : {
				"resourceType" : "Provenance",
				"id" : "Provenance/1",
				"target" : resources,
				"agent" : [ {
					"role" : {
						"system" : "http://hl7.org/fhir/provenance-participant-role",
						"code" : "derivation"
					},
					"type" : {
						"system" : "http://hl7.org/fhir/provenance-participant-type",
						"code" : "device"
					},
					"referenceUri" : "http://amida-tech.com/fhir/dre",
					"display" : "Data Reconciliation Engine"

				} ],
				"reason" : "update from DRE"
			},
			"transaction" : {
				"method" : "POST",
				"url" : "Provenance"
			},
			"base" : "http://localhost:8080/fhir"
		};

		bundle.entry.push(newProvenance);
	}
	var r = {};
	r.bundle = bundle;
	bundle = r;
	
	this.fhirClient.transaction(bundle,
			function(entry, response, responseCode) {
				success(entry, response, responseCode);
			}, error);
}

Client.prototype.getPatientRecord = function(patientId, retFunction,
		getFullRecord) {
	if (getFullRecord === undefined)
		getFullRecord = false;

	var theQuery;
	if (getFullRecord)
		theQuery = {
			'_id' : patientId,
			'_revinclude' : '*'
		};
	else
		theQuery = {
			'_id' : patientId
		};

	this.fhirClient.search({
		type : 'Patient',
		query : theQuery
	}, retFunction);

}

Client.prototype.findPatient = function(params, retFunction) {
	sss = {};
	this.fhirClient.search({
		type : 'Patient',
		query : sss
	}, retFunction);

}

Client.prototype.reconcile = function(fhirResource, patientId) {
	// first figure out what type of resource we are dealing with.
	// 2 broad categories, bundle, everything else.
	// for bundle is it a transaction?

	var resourceType = fhirResource.resoureType;
	if (resourceType == 'Bundle') {

	} else {
		//
	}

}

var btoa = function(str) {
	var buffer;

	if (str instanceof Buffer) {
		buffer = str;
	} else {
		buffer = new Buffer(str.toString(), 'binary');
	}

	return buffer.toString('base64');
}
