var prov = require('./provenance');

exports.createTransaction = function(fhirObject, createProvenance) {
	return new Client(fhirObject, createProvenance === undefined?false:createProvenance );
}

Transaction = function(fhirObject, createProvenance) {
	this.entry = [];
	if (createProvenance)
		this.provenance = prov.createProvenance();
	
	this.baseTransaction = {
			"resourceType" : "Bundle",
			"entry" : entry
	};
	
}


Transaction.prototype.addSource(source){
	
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


Transaction.prototype.addEntry(fhirObject, method, url, base){
	
	var rType = fhirObject.resourceType;
	var id;
	//this is naive, need to confirm there is not already a resource with the ID.
	if (fhirObject.id === undefined){
		id = rType+'/1';
		fhirObject.id = id;
	}else{
		id = fhirObject.id;
	}
	
	this.entry.push.entry({
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
