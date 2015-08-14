
exports.createProvenance = function(){
	return new Provenance();
}

Provenance = function(){
	this.resources = [];
	this.provenanceObject = {
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
					};
				
}

Provenance.prototype.addSource = function(sourceId){
	this.provenanceObject.entity = {
			"role":"source",
			"type": "Binary",
			"reference": sourceId,	
	};
}

Provenance.prototype.addResource = function(resourceId){
	this.resources.push({'reference' : resourceId});
}
	
