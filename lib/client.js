var mkFhir = require('fhir.js');
var prov = require('./provenance');
var trans = require('./transaction');
var dict = require('./mergeDefinitions/definition');
var diff = require('deep-diff').diff;
var request = require("request");
var _ = require("lodash");


/**
 * create a client object.  This will be used to in turn access the fhir server 
 * @param url - the base URL of the fhir server
 */
exports.getClient = function(url) {
	return new Client(url);
};

Client = function(url) {
	this.baseUrl = url;
	this.fhirClient = mkFhir({
		baseUrl : url
	});

};






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
				delete fhirObject.resource.id;
			}
		}
	} else {
		fhirObject = { resource: fhirObject};
	}

	this.fhirClient.create(fhirObject, function(entry, uri, config) {
		// this assumes history is part of the uri, which I believe to be
		// required but am not certain
		if (uri !== null) {
			var components = uri.match(/base\/((.*)\/(.*)\/_history\/(.*))/);
			var id = components[3];
			//set the response entry to the object reference.  i.e. "Patient/1/_history/1"
			entry = components[1];
		} else {
			//??
		}

		success(entry, uri, config);
	}, error);
};


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
	
	fhirObject = { resource: fhirObject};
	this.fhirClient.update(fhirObject, function(data, uri, config) {


		if (uri !== null) {
			// this assumes history is part of the uri, which I believe to be
			// required but am not certain
			var components = uri.match(/base\/((.*)\/(.*)\/_history\/(.*))/);
			var id = components[3];
			//set the response entry to the object reference.  i.e. "Patient/1/_history/1"
			data = components[1];
		} else {
			//??
		}
		
		success(data, uri,  config);
	},error);
	
};

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
	var transaction = trans.createTransaction(true);
	var resourceIndex = transaction.addEntry(fhirObject, 'POST');
	var sourceIndex;
	if (source !== undefined && source !== null)
		sourceIndex = transaction.addSource(source);

	this.fhirClient.transaction(transaction, function(entry, response, responseCode) {

			success(response.entry[1].transactionResponse.location, response, responseCode);
	}, error);
};

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
	var transaction = trans.createTransaction(true);
	var resourceIndex = transaction.addEntry(fhirObject, 'PUT');
	var sourceIndex;
	if (source !== undefined && source !== null)
		sourceIndex = transaction.addSource(source);


	this.fhirClient.transaction(transaction, function(entry, response, responseCode) {
				success(response.entry[1].transactionResponse.location, response, responseCode);
	}, error);

};


/**
 * execute a transaction and add provenance if not already present in the transaction
 * @param bundle - the transaction to be executed
 * @param source - the source file for the transaction, if present it is added to the transaction as a binary
 * @param success - call back function with params (objectId[], response, responseCode) with bundle being the fhir bundle response to the search.
 * 			objectId[] is and array of the the IDs of the objects in the transaction.  e.g. Patient/1/_history/1
 *          response - the complete response from the server for the transaction
 *          responseCode - the http response code (200, 201, etc...) 
 * @param error - error callback.  
 */
Client.prototype.transaction = function(bundle, source, success, error) {

	var transaction;
	if (source === undefined || source === null){
		//this should be more introspective as type to handle invalid object types gracefully.
		if (bundle.resourceType !== undefined)
			transaction =  { 'bundle': bundle};
	}else{
		transaction = trans.createTransaction(true);
		transaction.replaceTransaction(bundle, source, true);
	}
    var client = this;    
	var fc = this.fhirClient;
	this.fhirClient.transaction(transaction,
			function(entry, response, responseCode) {
				var t = response.entry;
				
		    	//pop the source and provenance?
				var sourceId;

		    	if (source !== undefined && source !== null){
			    	//source
			    	var sourceTransactionResponse = t.pop();

		    		var id = sourceTransactionResponse.transactionResponse.location;
		    		var components = id.match(/(.*)\/_history\/(.*)/);
		    		sourceId =  components[1];
		    	}
		    	//provenance
		    	var provenanceTransactionResponse = t.pop();
		    	if (source !== undefined && source !== null){
		    		//get the provenanceID
		    		var id = provenanceTransactionResponse.transactionResponse.location;
		    		var components = id.match(/\/(.*)\/_history\/(.*)/);
		    		
		    		theQuery = {
		    				'_id' : components[1]
		    		};
		    		
		    		fc.search({
		    			type : 'Provenance',
		    			query : theQuery
		    		}, function(err, searchResponse){
		    			
		    			var createdProvenance = searchResponse.entry;
		    			
		    			if ( createdProvenance.length > 1)
		    				console.log('got more than one response to a qeury by ID, printer on fire.');
		    			
		    			createdProvenance = createdProvenance[0].resource;
		    			createdProvenance.entity[0].reference = sourceId;
		    			
		    			
		    			client.update(createdProvenance,null,function(e) {
					    	entry = [];
					    	for (i =0; i < t.length; i++){
					    		//if it is a transaction response then get the location and extract the ID
					    		if(!_.isUndefined(t[i].transactionResponse)){
					    			if (_.isString(t[i].transactionResponse)){
					    				var temp = JSON.parse(t[i].transactionResponse);
					    				entry.push(temp.location);
					    			}else{
					    				entry.push(t[i].transactionResponse.location);
					    			}
					    		}
					    	}
							success(entry, response, responseCode);
		    			});
		    		});
		    		
		    		
		    	}else{
			    	entry = [];
			    	for (i =0; i < t.length; i++){
			    		//if it is a transaction response then get the location and extract the ID
			    		if(!_.isUndefined(t[i].transactionResponse)){
			    			if (_.isString(t[i].transactionResponse)){
			    				var temp = JSON.parse(t[i].transactionResponse);
			    				entry.push(temp.location);
			    			}else{
			    				entry.push(t[i].transactionResponse.location);
			    			}
			    		}
			    	}
			    	
					success(entry, response, responseCode);
		    	}
			}, error);
};


/**
 * shorthand to do a search by patientID
 * @param patientId - id to be searched (1,2,etc...)
 * @param retFunction - call back return function.  NOTE: not overriding this one like I am the rest.  Might want to change that.
 * @param getFullRecord - retrieves all directly associated records of the patient such as prescriptions and observations.  Basically returns the patient record.
 */
Client.prototype.getPatientRecord = function(patientId, retFunction, getFullRecord) {
	this.getRecord('Patient', patientId, retFunction, getFullRecord);
}

Client.prototype.getRecord = function(recordType, recordId, retFunction, getFullRecord) {
	
	if (getFullRecord === undefined)
		getFullRecord = false;

	
	var theQuery;
	if (getFullRecord){
		theQuery = {
			'_id' : recordId,
			'_include': '*',
			'_revinclude' : '*',
			'_count':50
		};
	}else{
		theQuery = {
			'_id' : recordId
		};
	}
	
	var internal = this;
	this.fhirClient.search({
		type : recordType,
		query : theQuery
	}, function(err, success){
		if (!_.isUndefined(success.link[1])){
			console.log('compound');
			//if there is a next then the results took more than the size allowed.
			//+2 because hapi paging includes the patient record on every page and sometimes duplicates
			//entries on other pages.  
			var numQueries = Math.floor(success.total/50)+2;
			var components = success.link[1].url.match(/(.*)_getpagesoffset=(\d+)(.*)/);
			var queries = [];
			for (var feh=1; feh <= numQueries; feh++){
				queries.push(components[1]+'_getpagesoffset='+(50*feh)+components[3]);
			}
	        var retrievedIds = [];
	        for (var q=0; q < success.entry.length; q++){
	        	retrievedIds.push(success.entry[q].resource.resourceType+'/'+success.entry[q].resource.id);
	        }
	        
			internal.groupGet(queries, function(errs, bundles){
				var tempBundle;
				var tempId;
				for (var t=0; t < bundles.length; t++){
					tempBundle = JSON.parse(bundles[t]);
			        for (q=0; q < tempBundle.entry.length; q++){
			        	tempId = tempBundle.entry[q].resource.resourceType+'/'+tempBundle.entry[q].resource.id;
			        	if (retrievedIds.indexOf(tempId)==-1){
			        		retrievedIds.push(tempId);
			        		success.entry.push(tempBundle.entry[q]);
			        	}else{
//			        		console.log("duplicate entry "+tempId)
			        	}
			        }
					
				}
				
				retFunction(err, success);
			});
		}else{
			retFunction(err, success);
		}

	});

};

Client.prototype.reconcilePatient = function(fhirResource, patientId, callback) {

	this.getPatientRecord(patientId, function(err, bundle){
	 	var count = (bundle.entry && bundle.entry.length) || 0;

	  	//if bundle entries is 0 then the patient was not found
	  	var patientRecord = {};
	  	entries = bundle.entry;
	  	//get the entries and break them down by type.
	  	for (var i =0; i < entries.length; i++){
	  		var resource = entries[i].resource;
	  		var rType = resource.resourceType;
	  		if (patientRecord[rType] === undefined)
	  			patientRecord[rType] = [];
	  		patientRecord[rType].push(resource);
	  	}
	  	  	
	  	var updateRecord = {};

		if (_.isString(fhirResource)){
//			//FIXME: This is wrong
//			callback(null, matchSet);
//			return;
			fhirResource = JSON.parse(fhirResource);
		}
		
		if (fhirResource.resourceType === undefined && fhirResource.resource !== undefined){
	  		fhirResource = fhirResource.resource;
	  	}
	  	//now do the same for the fhirResource.  This might be a bit trickier since we don't know if it is a bundle, transaction, or individual fhir resource.
	  	if (_.isArray(fhirResource)){
	  		
		  	for (var fhirResIndex =0; fhirResIndex < fhirResource.length; fhirResIndex++){
		  		if (updateRecord[fhirResource[fhirResIndex].resource.resourceType] === undefined)
		  			updateRecord[fhirResource[fhirResIndex].resource.resourceType] = [];
		  		updateRecord[fhirResource[fhirResIndex].resource.resourceType].push(fhirResource[fhirResIndex].resource);
		  	}
	  		
	  	}else
	  	if (fhirResource.resourceType == 'Bundle'){
	  		
		  	var entries = fhirResource.entry;
		  	for (var entryIndex =0; entryIndex < entries.length; entryIndex++){
		  		if (updateRecord[entries[entryIndex].resource.resourceType] === undefined)
		  			updateRecord[entries[entryIndex].resource.resourceType] = [];
		  		updateRecord[entries[entryIndex].resource.resourceType].push(entries[entryIndex].resource);
		  	}
	  	}else{
	  		updateRecord[fhirResource.resourceType] = [];
	  		updateRecord[fhirResource.resourceType].push(fhirResource);

	  	}
	  	
	  	/* *********
	  	 * new code
	  	 */
	  	
	  	for (var key in updateRecord){
	  		if (_.isUndefined(patientRecord[key])){
	  			patientRecord[key] = updateRecord[key];
	  		}else{
	  			patientRecord[key] = patientRecord[key].concat(updateRecord[key]);
	  		}
	  	}
	  	
	  	var matchMatrix = {};
	  	var matchSet = [];
	  	var noMatchSet = [];
	  	//run through by resourceType
	  	var newMatchesFound = true;
	  	while (newMatchesFound){
	  		//initialize the foundMatches to false
	  		//if no matches are found in processing the loop will fall through
		  	newMatchesFound = false;
			//empty the noMatchSet
			noMatchSet = [];
		  	for (var key in patientRecord){

		  		//loop through comparing all records with each other
		  		newMatchesFound = findMatches(patientRecord, key, matchSet, noMatchSet, matchMatrix)||newMatchesFound;		
		  	}
	  	}
		callback(err, matchSet.concat(noMatchSet));  	
		
		/* *****************
		 * end new code
		 */
		
	  	//now we have 2 objects, one which is the record being posted, the other which is the record retrieved
	  	//go through the elements one at a time and determine the closest match (if any) to each particular record.
	  	//check for the indirect references not returned (such as medication)
//	  	var matchSet = {};
//	  	for (var key in updateRecord){
//	  		if (_.isUndefined(patientRecord[key])){
//	  			//no matches found, do something here
//	  			for (var j=0; j < updateRecord[key].length; j++){
//		  			var r = { changes: 'new', update:updateRecord[key][j]};
//			  		if (matchSet[key] === undefined)
//			  			matchSet[key] = [];
//			  		matchSet[key].push(r);	  			
//	  			}
//	  		}else{	
//	  			for (var updRecIndex=0; updRecIndex < updateRecord[key].length; updRecIndex++){
//	  				//set threshold for update to 40.  
//	  				//This should probably be higher (100 being a perfect match)
//	  				//but 40 will do for now.
//	  				var score = 40;
//	  				var scoringRecord = null;
//		  			for (var k =0; k < patientRecord[key].length; k++){
//		  				 var a = patientRecord[key][k];
//		  				 var b= updateRecord[key][updRecIndex];
//		  				 var c =  scoreRecord(a, b);
//
//		  				 if (c.score > score){
//		  					 scoringRecord = { changeType: 'update', lhs: a, rhs: b, changes:c.changes};
//		  					 score = c.score;
//		  					 
//		  				 }
//		  			}
//		  			if (scoringRecord === null){
//		  				var tempChange = { changes: 'new', update:updateRecord[key][updRecIndex]};
//				  		if (matchSet[key] === undefined)
//				  			matchSet[key] = [];
//				  		matchSet[key].push(tempChange);
//		  			}else{
//				  		if (matchSet[key] === undefined)
//				  			matchSet[key] = [];
//				  		matchSet[key].push(scoringRecord);
//		  			}
//	  			}
//
//	  		}
//	  	
//	  	}
//	  	callback(null, matchSet);
	}, true);
	
};


/**
 *
 * @param fhirResource
 * @param patientId
 */
Client.prototype.reconcile = function(fhirResource, objectId, success) {
	// first figure out what type of resource we are dealing with.
	// 2 broad categories, bundle, everything else.
	// for bundle is it a transaction?
	if (fhirResource.resourceType === undefined && fhirResource.resource !== undefined){
		fhirResource = fhirResource.resource;
	}
	
	var resourceType = fhirResource.resourceType;
	if (resourceType == 'Bundle') {
			//TODO: loop through the individual elements of the bundle
	} else {
		var rType = fhirResource.resourceType;
		var mergeDefinition = dict.definitions[rType];
		if (mergeDefinition === undefined){
			mergeDefinition = dict.definitions.default_definition;
		}
		
		var queryArray = mergeDefinition.searchQueryArray(fhirResource, objectId);
		this.groupSearch(rType, queryArray, function(errs, bundles){
			var potentialMatches = [];
			var potentialMatchesIds = [];

			//for each bundle get the entry arrays
			//loop through the results of all the queries
			for (var i =0; i < bundles.length; i++){
				entry = bundles[i].entry;
				//entry will be undefined if the search returned no results
				if (entry !== undefined){
					//loop through all the returned values for a particular query
					for (var j=0; j < entry.length; j++){
						var id = entry[j].resource.id;
						//only put matched that have not already been added into the list of potential matches
						if (potentialMatchesIds.indexOf(id)<0){
							potentialMatchesIds.push(id);
							potentialMatches.push(entry[j].resource);
						}			
					}
				}else{
					console.log('No results found for query.');
				}

			}
			
			//do comparison
			var score = 40;
			var scoringRecord = null;
			for (var matchIndex =0; matchIndex < potentialMatches.length; matchIndex++){
  				
  				 var b= potentialMatches[matchIndex];
  				 var c =  scoreRecord(fhirResource, b);
  				 if (c.score > score){
  					 scoringRecord = { changeType: 'update', lhs: fhirResource, rhs: b, changes:c.changes};
  					 score = c.score;
  				 }
			}
			
			success(errs, scoringRecord);
		});
	}

};


/**
 * 
 * @param patientId
 * @param success
 */
Client.prototype.deduplicate = function(patientId, success) {
	
//	console.log('patient ID: '+patientId);
	//get the record
	this.getPatientRecord(patientId, function(err, bundle){

	  	//if bundle entries is 0 then the patient was not found
	  	var patientRecord = {};
	  	
	  	entries = bundle.entry;
	 	var count = (bundle.entry && bundle.entry.length) || 0;
	  	//get the entries and break them down by type.
	  	for (var i =0; i < entries.length; i++){
	  		var resource = entries[i].resource;
	  		var rType = resource.resourceType;
	  		if (patientRecord[rType] === undefined)
	  			patientRecord[rType] = [];
	  		patientRecord[rType].push(resource);
	  	}
	  	
	  	var matchMatrix = {};
	  	var matchSet = [];
	  	var noMatchSet = [];
	  	//run through by resourceType
	  	var newMatchesFound = true;
	  	while (newMatchesFound){
	  		//initialize the foundMatches to false
	  		//if no matches are found in processing the loop will fall through
		  	newMatchesFound = false;
			//empty the noMatchSet
			noMatchSet = [];
		  	for (var key in patientRecord){

		  		//loop through comparing all records with each other
		  		newMatchesFound = findMatches(patientRecord, key, matchSet, noMatchSet, matchMatrix)||newMatchesFound;		
		  	}
	  	}
		success(err, matchSet.concat(noMatchSet));
	}, true);
	
	
};

/**
 * executes an array of fhir queries and returns the results as a group
 * 
 */
Client.prototype.groupSearch = function(rType, queries, shared_callback) {
	var counter = queries.length;
	var bundles = [];
	var errs = [];
	var callback = function (err, bundle) {

	  counter --;
	  bundles.push(bundle);
	  errs.push(err);
	  if (counter === 0) {	 
	    shared_callback(errs, bundles);
	  }
	};
	
	for (var i=0;i<queries.length;i++) {
	  this.search(rType, queries[i], callback);
	}
};


var scoreRecord = function(original, proposed, matchMatrix){
	return dict.calculateScore(proposed, original, matchMatrix);
};

/**
 * Internal Function
 * gets the results of an array of URLs and returns them as a group
 * @param urls
 * @param shared_callback
 */
Client.prototype.groupGet = function(urls, shared_callback) {
	var counter = urls.length;
	var bundles = [];
	var errs = [];
	var callback = function (resp) {

	  counter --;
	  bundles.push(resp.bundle);
	  errs.push(resp.error);
	  if (counter === 0) {	 
	    shared_callback(errs, bundles);
	  }
	};
	
	for (var i=0;i<urls.length;i++) {
	  doGet(urls[i], callback);
	}

};


/**
 * Internal Function
 * get a single URL and return the response.
 */
var doGet = function(uri, success) {
	request(uri,function(error, response, body) {
		
		success({
			error: error,
			bundle: body,
			response: response
			
		});
	});
  };

/**
 * Internal function.
 * populate match and noMatch arrays.
 * returns true if a match is found in the set.
 */
var findMatches = function(patientRecord, key, matchSet, noMatchSet, matchMatrix){

	var numRecords = patientRecord[key].length;
	var foundNewMatch = false;
	var used = [];
	for (var patRecIndex1=0; patRecIndex1 < numRecords; patRecIndex1++){
		
		//set threshold for match to 70 to lower false matches
		var closestScore =70;
		
		//we will null out records that have already been matched so we can ignore them
		if (patientRecord[key][patRecIndex1] !== null && matchMatrix[ key+'/'+patientRecord[key][patRecIndex1].id] === undefined){
			
			var id1 = key+'/'+patientRecord[key][patRecIndex1].id;
//			if (id1.indexOf(key) !==0)
//				id1 = key+'/'+id1;
			
			
			var comp = { changeType: 'new', lhs:patientRecord[key][patRecIndex1]};
  			for (var patRecIndex2=patRecIndex1+1; patRecIndex2 < numRecords; patRecIndex2++){
					
				var closestMatch = '';
  				if (patientRecord[key][patRecIndex2] !== null && patRecIndex1 != patRecIndex2 && matchMatrix[key+'/'+patientRecord[key][patRecIndex2].id] === undefined){
  					var id2 = patientRecord[key][patRecIndex2].id;
  					if (id2.indexOf(key) !==0)
  						id2 = key+'/'+id2;
  					//FIXME: pass in known matches so that references can be considered a match if the actual objects referenced are considered a match.
  					var c =  scoreRecord(patientRecord[key][patRecIndex1], patientRecord[key][patRecIndex2], matchMatrix);
  					
  					if (c.changes === null || c.changes === '' || c.changes.length == 0){

  						
  						if (comp.matches === undefined){
  							comp.matches = [];
  							matchMatrix[id1] = id1;
  						}
  						
  						matchMatrix[id2] = id1;
  						
  						comp.changeType = 'match';
  						//get rid of any possible partial matches
  						delete comp.rhs;
  						delete comp.changes;
  						comp.matches.push(patientRecord[key][patRecIndex2]);
  						closestScore = 100;
  						patientRecord[key][patRecIndex2] = null;
  						foundNewMatch = true;
  					}else if (c.score > closestScore){
  						comp = { changeType: 'update', lhs:patientRecord[key][patRecIndex1] , rhs: patientRecord[key][patRecIndex2], changes:c.changes};
  						closestScore = c.score;	
  						closestMatch = id2;
  					}
  				}				
  			}
  			
  			
  			if (comp.changeType == 'new' && used.indexOf(id1) <0 && _.isUndefined(matchMatrix[id1])){
  				if ('Patient' == key){
  					console.log('adding as new: '+id1);
  	  				console.log('used: '+JSON.stringify(used));
//  	  				console.log('match: '+JSON.stringify(matchSet));
  	  				console.log('notMatch: '+JSON.stringify(noMatchSet));
  	  				console.log('matchMatrix'+JSON.stringify(matchMatrix));
  	  				
  				}		
  				noMatchSet.push(comp);
  			}else if (comp.changeType != 'match'){
  				if (closestMatch != ''){
  					used.push(closestMatch);
  				}
  				noMatchSet.push(comp);
  			}else{
  				if ('Patient' == key){
  					console.log('QQQQQQQQQQQQQQQQQQQQQQQQQQQ'+id1);
  				}
  				matchSet.push(comp);
  			}
  				
		}

	}
	return foundNewMatch;
};




Client.prototype.merge = function(recordType, primary, duplicates, callback){

	var c = this;
	
	var transaction = trans.createTransaction(true);
	
	//loop through the duplicates
	_.forEach(duplicates, function(val){
		
		//for each duplicate get an includes/revincludes for the object
		c.getRecord(recordType,val,function(error, success) {
			var dupEntries = success.entry;
			_.forEach(success.entry, function(entry){
				if (entry.resource.id != val && entry.resource.resourceType != recordType){
					transaction.addEntry(entry.resource, 'PUT');
				}
			});
			
			//remove the original object from the response
			//stringify
			//replace all references to the duplicate with the primary
			//create a transaction so save the updated records

			callback(error, success);
		}, true);
	});
	
};
