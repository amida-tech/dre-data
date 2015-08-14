var prov = require('./provenance');

/**
 * created a transaction object.  NOTE: the fhir transaction is actually under this.bundle.  
 * This eases use with fhir.,js but more importantly makes it easier to deal with provenance.
 * TODO: refactor to keep it as a pure transaction object but not priority since this is "internal" to the client.
 * @param - fhirObject or array of fhir objects that we want as part of the transaction
 * @param - method to use for these objects if not specified (PUT, POST, GET, etc...)
 * @param - create a provenance object if not already present
 */
exports.createTransaction = function(fhirObject, method, createProvenance) {
	return new Transaction(fhirObject, method, createProvenance === undefined?false:createProvenance );
}

Transaction = function(fhirObject, method, createProvenance) {
	
	this.entry = [];
	this.bundle = {
			"resourceType" : "Bundle",
			"entry" : this.entry
	};
	this.addEntry(fhirObject, method);
	
	if (createProvenance){
		this.provenance = prov.createProvenance();
		this.addEntry(this.provenance);
	}

	

	
}

/**
 * replace the transaction currently in the transaction object with an already existing one
 * @param fhirTransaction
 * @param source
 * @param createProvenance
 */
Transaction.prototype.replaceTransaction = function(fhirTransaction, source, createProvenance){
	this.entry = fhirTransaction.entry;
	this.bundle = fhirTransaction;
	
	// loop through the bundle and get all objects.

	var entries = this.bundle.entry;
	for (var i = 0; i < entries.length; i++) {
		//if we already have a provenance, do not create one
		if (entries[i].resourceType == 'Provenance') {
			createProvenance = false;
		}
	}
	
	//reset the provenance
	if (createProvenance){
		this.provenance = prov.createProvenance();
		for (i =0; i < this.entry.length; i++){
			var fhirObject = this.entry[i].resource;
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
	
	if (source !== undefined && source != null)
		this.addSource(source);
	

}

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
		
	this.addEntry(newBinary, 'POST');
	if (this.provenance !== undefined)
		this.provenance.addSource('Binary/source');

}


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
		for (i =0; i < fhirObject.length; i++){
			console.log(fhirObject[i]);
			this.addEntry(fhirObject[i], method, url, base);
		}
	}else if (fhirObject.resource !== undefined){
		//this is a resource object already so leave it intact
		if (this.provenance !== undefined)
			this.provenance.addResource(id);
		
		this.entry.push(fhirObject);
	}else{
		var rType = fhirObject.resourceType;
		var id;
		//this is naive, need to confirm there is not already a resource with the ID.
		if (fhirObject.id === undefined){
			id = rType+'/1';
			fhirObject.id = id;
		}else{
			id = fhirObject.id;
		}
		
		this.entry.push({
			"resource" : fhirObject,
			"transaction" : {
				"method" : method === undefined?"POST":method,
				"url" : url === undefined?rType: url
			},
			"base" : base === undefined?"http://localhost:8080/fhir":base
		});
	
		if (this.provenance !== undefined)
			this.provenance.addResource(id);
	}
}

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
}