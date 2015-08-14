var mkFhir = require('fhir.js');
var prov = require('./provenance');
var trans = require('./transaction');

/**
 * create a client object.  This will be used to in turn access the fhir server 
 * @param url - the base URL of the fhir server
 */
exports.getClient = function(url) {
	return new Client(url);
}

Client = function(url) {
	this.baseUrl = url;
	this.fhirClient = mkFhir({
		baseUrl : url
	});

}

/**
 * Perform a search on the fhir server
 * @param objectType - type of object being searched for.  e.g. Patient, Medication, Practitioner, etc....
 * @param theQuery - the query to use.  see fhir.js documentation until I or someone else writes something better.
 * @param success - call back function with params (err, bundle) with bundle being the fhir bundle response to the search.
 */
Client.prototype.search = function(objectType, theQuery, success) {
	// this is a straight passthrough right now.
	this.fhirClient.search({
		type : objectType,
		query : theQuery
	}, function(err, bundle) {
		success(err, bundle);
	});
};

/**
 * serialize the fhir object to the server.
 * @param fhirObject - fhir object to be serialized
 * @param source - source file.  if present the source file will be serialized as a binary object
 * 		FIXME: does not do this currently, not sure if we even want to since this is without provenance.
 * @param success - call back function with params (objectId, uri, config) with bundle being the fhir bundle response to the search.
 * 			objectId is the ID of the newly created object.  e.g. Patient/1/_history/1
 *          uri is the entire URI to the object.  http://localhost:8080/fhir/base/Patient/1/_history/1
 *          config is the config used (part of the fhir.js response)
 * @param error - error callback.  Not sure it ever gets called but from fhir.js (TODO: check and see)
 */
Client.prototype.create = function(fhirObject, source, success, error) {
	if (fhirObject.resourceType === undefined || fhirObject.resourceType != 'Bundle') {
		// not dealing with a bundle
		if (fhirObject.resource === undefined) {
			// not dealing with a resource, assume an entry
			// wrap the entry in a resource
			fhirObject = { resource: fhirObject};
		} else {
			if (fhirObject.resource.id !== undefined) {
				// delete the id since it is not allowed for a create.
				delete fhirObject.resource.id
			}
		}
	} else {
		fhirObject = { resource: fhirObject};
	}

	this.fhirClient.create(fhirObject, function(entry, uri, config) {
		// this assumes history is part of the uri, which I believe to be
		// required but am not certain
		if (uri != null) {
			var components = uri.match(/base\/((.*)\/(.*)\/_history\/(.*))/);
			var id = components[4];
			//set the response entry to the object reference.  i.e. "Patient/1/_history/1"
			entry = components[2];
		} else {
			//??
		}

		success(entry, uri, config);
	}, error);
}


/**
 * update an existing fhir object to the server.
 * @param fhirObject - fhir object to be serialized
 * @param source - source file.  if present the source file will be serialized as a binary object
 * 		FIXME: does not do this currently, not sure if we even want to since this is without provenance.
 * @param success - call back function with params (objectId, uri, config) with bundle being the fhir bundle response to the search.
 * 			objectId is the ID of the newly created object.  e.g. Patient/1/_history/1
 *          uri is the entire URI to the object.  http://localhost:8080/fhir/base/Patient/1/_history/1
 *          config is the config used (part of the fhir.js response)
 * @param error - error callback.  Not sure it ever gets called but form fhir.js (TODO: check and see)
 */
Client.prototype.update = function(fhirObject, source, success, error) {
	//TODO: IMPLEMENT
	
}

/**
 * serialize the fhir object to the server and create a provenance document
 * @param fhirObject - fhir object to be serialized
 * @param source - source file.  if present the source file will be serialized as a binary object
 * @param success - call back function with params (objectId, response, responseCode) with bundle being the fhir bundle response to the search.
 * 			objectId is the ID of the newly created object.  e.g. Patient/1/_history/1
 *          response - the complete response from the server for the transaction
 *          responseCode - the http response code (200, 201, etc...) 
 * @param error - error callback.  Not sure it ever gets called but from fhir.js (TODO: check and see)
 */
Client.prototype.createWithProvenance = function(fhirObject, source, success, error) {

	// create a transaction for the object
	var transaction = trans.createTransaction(fhirObject, 'POST', true);
	
	if (source !== undefined && source != null)
		transaction.addSource(source);


	this.fhirClient.transaction(transaction,
			function(entry, response, responseCode) {
				success(response.entry[1].transactionResponse.location, response, responseCode);
	}, error);
}

/**
 * upadate the fhir object on the server and create a provenance document
 * @param fhirObject - fhir object to be serialized
 * @param source - source file.  if present the source file will be serialized as a binary object
 * @param success - call back function with params (objectId, response, responseCode) with bundle being the fhir bundle response to the search.
 * 			objectId is the ID of the newly created object.  e.g. Patient/1/_history/1
 *          response - the complete response from the server for the transaction
 *          responseCode - the http response code (200, 201, etc...) 
 * @param error - error callback.  Not sure it ever gets called but from fhir.js (TODO: check and see)
 */
Client.prototype.updateWithProvenance = function(fhirObject, source, success, error) {
	
	// create a transaction for the object
	var transaction = trans.createTransaction(fhirObject, 'PUT', true);
	
	if (source !== undefined && source != null)
		transaction.addSource(source);


	this.fhirClient.transaction(transaction,
			function(entry, response, responseCode) {
				success(response.entry[1].transactionResponse.location, response, responseCode);
	}, error);

}


/**
 * execute a transaction and add provenance if not already present in the transaction
 * @param bundle - the transaction to be executed
 * @param source - the source file for the transaction, if present it is added to the transaction as a binary
 * @param success - call back function with params (objectId[], response, responseCode) with bundle being the fhir bundle response to the search.
 * 			objectId[] is and array of the the IDs of the objects in the transaction.  e.g. Patient/1/_history/1
 *          response - the complete response from the server for the transaction
 *          responseCode - the http response code (200, 201, etc...) 
 * @param error - error callback.  Not sure it ever gets called but from fhir.js (TODO: check and see)
 */
Client.prototype.transaction = function(bundle, source, success, error) {

	var transaction = trans.createTransaction(bundle, 'POST', true);
	transaction.replaceTransaction(bundle, source, true);
	            
	this.fhirClient.transaction(transaction,
			function(entry, response, responseCode) {
		
				var t = response.entry;
		    	//pop the source and provenance?
		    	if (source !== undefined && source != null){
			    	//source
			    	t.pop();
		    	}
		    	//provenance
		    	t.pop();
		    	entry = [];
		    	for (i =0; i < t.length; i++){
		    		//if it is a transaction response then get the location and extract the ID
		    		if(t[i].transactionResponse !== undefined){
		    			if (t[i].transactionResponse instanceof String){
		    				var temp = JSON.parse(t[i].transactionResponse);
		    				entry = temp.location;
		    			}else{
		    				entry = t[i].transactionResponse.location;
		    			}
		    		}
		    	}
    
				success(entry, response, responseCode);
			}, error);
}

/**
 * shorthand to do a search by patientID
 * @param patientId - id to be searched (1,2,etc...)
 * @param retFunction - call back return function.  NOTE: not overriding this one like I am the rest.  Mioght want to change that.
 * @param getFullRecord - retrieves all directly associated records of the patient as well such as prescriptions and observations.  Basically returns the patient record.
 */
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

/**
 * not complete.  a short hand function to find a patient by some criteria.  May not survive to the end.
 * @param params
 * @param retFunction
 */
Client.prototype.findPatient = function(params, retFunction) {
	sss = {};
	this.fhirClient.search({
		type : 'Patient',
		query : sss
	}, retFunction);

}

/**
 * not complete.  reconciliation stub
 * @param fhirResource
 * @param patientId
 */
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


