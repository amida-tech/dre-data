var prov = require('./provenance');

/**
 * created a transaction object.  NOTE: the fhir transaction is actually under this.bundle.  
 * This eases use with fhir.,js but more importantly makes it easier to deal with provenance.
 * TODO: refactor to keep it as a pure transaction object but not priority since this is "internal" to the client.
 * @param - fhirObject or array of fhir objects that we want as part of the transaction
 * @param - method to use for these objects if not specified (PUT, POST, GET, etc...)
 * @param - create a provenance object if not already present
 */
exports.createTransaction = function(createProvenance) {
	return new Transaction(createProvenance === undefined?false:createProvenance );
};

Transaction = function(createProvenance) {
	
	this.bundle = { resourceType: "Bundle" };
	this.bundle.entry = [];

	if (createProvenance){
		this.provenance = prov.createProvenance();
		this.addEntry(this.provenance);
	}	
};

/**
 * replace the transaction currently in the transaction object with an already existing one
 * @param fhirTransaction
 * @param source
 * @param createProvenance
 */
Transaction.prototype.replaceTransaction = function(fhirTransaction, source, createProvenance){
//	this.entry = fhirTransaction.entry;
	this.bundle = fhirTransaction;
	
	// loop through the bundle and get all objects.

	var entries = this.bundle.entry;
	for (var i = 0; i < entries.length; i++) {
		//if we already have a provenance, do not create one
		if (entries[i].resourceType == 'Provenance') {
			createProvenance = false;
		}
	}
//	console.log('create provenance?');
	//reset the provenance
	if (createProvenance){
//		console.log('yes, create provenance');
		this.provenance = prov.createProvenance();
		for (i =0; i < entries.length; i++){
			var fhirObject = entries[i].resource;
			var rType = fhirObject.resourceType;
			var id;
			//this is naive, need to confirm there is not already a resource with the ID.
			if (fhirObject.id === undefined){
				id = rType+'/1';
				fhirObject.id = id;
			}else{
				id = fhirObject.id;
			}
			this.provenance.addResource(id);
		}
		this.addEntry(this.provenance);
		
	}else if (this.provenance !== undefined){
		delete this.provenance;
	}
	
	if (source !== undefined && source !== null)
		return this.addSource(source);
	

};

/**
 * add a source for the transaction
 * @param source - will be saved as a binary file
 */
Transaction.prototype.addSource = function(source){
	
	var newBinary = {
			"resourceType" : "Binary",
			"id" : "Binary/source",
			"contentType" : "text/plain",
			"content" : btoa(source)
		};
		
	if (this.provenance !== undefined)
		this.provenance.addSource('Binary/source');
		
	//return the index of the source location in the transaction
	return this.addEntry(newBinary, 'POST');

};


/**
 * add a new fhirObject or array of fhirObjects to the transaction
 * @param fhirObject - fhirObject or array of fhir objects that we want as part of the transaction
 * @param method - method to use for these objects if not specified (PUT, POST, GET, etc...)
 * @param url - url for the transaction element. e.t. Patient, Prescription, etc...
 * @param base - base url for the server.  e.g. http://localhost:8080/fhir
 */
Transaction.prototype.addEntry = function(fhirObject, method, url, base){
	//if it is an array of objects add them each individually
	if (fhirObject instanceof Array){
		entryIndex = [];
		for (i =0; i < fhirObject.length; i++){
			entryIndex.push(this.addEntry(fhirObject[i], method, url, base));
		}
		//return the position in the transaction where each added element is located
		return entryIndex;
	}else if (fhirObject.resource !== undefined){
		//this is a resource object already so leave it intact
		if (this.provenance !== undefined)
			this.provenance.addResource(id);
		
		this.bundle.entry.push(fhirObject);
	}else{
		var rType = fhirObject.resourceType;
		var id;
		//this is naive, need to confirm there is not already a resource with the ID.
		if (fhirObject.id === undefined){
			id = rType+'/1';
			fhirObject.id = id;
		}else{
			
			id = fhirObject.id;
			//if the ID does not include the resourceType already, add it.
			//generally the ID for POSTS in a transaction will already have it. 
			//every other type should not however and thus the need to build <type>/<id>
			if (id.indexOf("/", 0) <0){
				id = rType+'/'+id;
			}
		}
		
		if (url === undefined){
			//if a new entry we just set the search to the resourceType (e.g. Patient, Medication, etc...
			if (method == "POST"){
				url = rType;
			}else{
				//if it is not a new entry then we set the search to the resource ID.  e.g. Patient/1
				url = id;
			}
		}
		this.bundle.entry.push({
			"resource" : fhirObject,
			"transaction" : {
				"method" : method === undefined?"POST":method,
				"url" : url
			},
			"base" : base === undefined?"http://localhost:8080/fhir":base
		});
	
		if (this.provenance !== undefined)
			this.provenance.addResource(id);
	}
	//return the position in the transaction where the added element is located
	return this.bundle.entry.length -1;
	
};

/**
 * base 64 encode a string
 */
var btoa = function(str) {
	var buffer;

	if (str instanceof Buffer) {
		buffer = str;
	} else {
		buffer = new Buffer(str.toString(), 'binary');
	}

	return buffer.toString('base64');
};