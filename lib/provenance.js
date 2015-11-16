/**
 * creates a provenance object
 */
exports.createProvenance = function(id){
	
	return new Provenance(id);

	
};

Provenance = function(id){
		if (id !== undefined)
			this.id = id;
		else
			this.id = "Provenance/tempProvId";
		
		this.resourceType = "Provenance";
		
		this.target = [];
		this.agent = [ {
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

		} ];
		this.reason =  "update from DRE";
					
				
};

/**
 * add a source reference to the provenance.
 * @param sourceId
 */
Provenance.prototype.addSource = function(sourceId){
	
	//FIXME: this does not work correctly.  Unlike entries it does not update the entity for a transaction.
	// we will need to process provenance outside of the transaction. or update the source reference on insert.  
	// not sure which I prefer.
	this.entity = {
			"role":"source",
			"type": "Binary",
			"reference": sourceId,	
	};
};

/**
 * and an ID of a fhir object impacted by the transaction
 * @param resourceId
 */
Provenance.prototype.addResource = function(resourceId){
	//don't add the provenance to itself
	if (resourceId != this.id)
		this.target.push({'reference' : resourceId});
};
	
