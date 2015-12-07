var diff = require('deep-diff').diff;
var lev = require('../levenshtien').getEditDistance;
var _ = require("lodash");

var definitions = exports.definitions = {
	//define these inline or in individual files. ...  individual files eventually but for the moment keep them here till I firm up format
	"default_definition":{
		shared: true,
		searchQueryArray:function(obj, id){
			//if we are in the default set how do we want to search?
			var query = [];
			
			if (id !== undefined || obj.id !== undefined){
				var objectId = obj.resourceType+'/'+obj.id;
				if (id !== undefined){
					patientId = obj.resourceType+'/'+id;
				}
				query.push({_id: patientId});
			}
			return query;
		},	matchCriteria:{	
			id:[0,-1],
			text:[0,-1],
			meta:[0,0],
			default_value:[-6,-6]
		
		},
		calculateScore:function(orig, match, matchMatrix, patientRecord){
			return calcScore(orig, match, this.matchCriteria, matchMatrix, patientRecord);
		}
		
	},
	"DocumentReference":{
		shared: true,
		searchQueryArray:function(obj, id){
			//if we are in the default set how do we want to search?
			var query = [];
			
			if (id !== undefined || obj.id !== undefined){
				var objectId = obj.resourceType+'/'+obj.id;
				if (id !== undefined){
					patientId = obj.resourceType+'/'+id;
				}
				query.push({_id: patientId});
			}
			return query;
		},
		matchCriteria:{
				id:[0,-1],
				text:[0,-1],
				meta:[0,0],
				content_attachment_url:[-10, -80],
				default_value:[-1,-4]
		},
		calculateScore:function(orig, match, matchMatrix, patientRecord){
			return calcScore(orig, match, this.matchCriteria, matchMatrix, patientRecord);
		}
		
	},
	"Provenance":{
		shared: true,
		searchQueryArray:function(obj, id){
			//if we are in the default set how do we want to search?
			var query = [];
			
			if (id !== undefined || obj.id !== undefined){
				var objectId = obj.resourceType+'/'+obj.id;
				if (id !== undefined){
					patientId = obj.resourceType+'/'+id;
				}
				query.push({_id: patientId});
			}
			return query;
		},
		matchCriteria:{
				id:[0,-1],
				text:[0,-1],
				meta:[0,0],
				target_reference:[-10, -80],
				entity_reference:[-10, -80],
				default_value:[-10,-15]
		},
		calculateScore:function(orig, match, matchMatrix, patientRecord){
			return calcScore(orig, match, this.matchCriteria, matchMatrix, patientRecord);
		}
		
	},
	"Claim":{
		shared: true,
		searchQueryArray:function(obj, id){
			//if we are in the default set how do we want to search?
			var query = [];
			
			if (id !== undefined || obj.id !== undefined){
				var objectId = obj.resourceType+'/'+obj.id;
				if (id !== undefined){
					patientId = obj.resourceType+'/'+id;
				}
				query.push({_id: patientId});
			}
			return query;
		},
		matchCriteria:{
				id:[0,-1],
				text:[0,-1],
				meta:[0,0],
				diagnosis_diagnosis_code:[-10, -29],
				identifier_value:[-10, -20],
				default_value:[-6,-6]
		},
		calculateScore:function(orig, match, matchMatrix, patientRecord){
			return calcScore(orig, match, this.matchCriteria, matchMatrix, patientRecord);
		}
		
	},
	"ClaimResponse":{
		shared: true,
		searchQueryArray:function(obj, id){
			//if we are in the default set how do we want to search?
			var query = [];
			
			if (id !== undefined || obj.id !== undefined){
				var objectId = obj.resourceType+'/'+obj.id;
				if (id !== undefined){
					patientId = obj.resourceType+'/'+id;
				}
				query.push({_id: patientId});
			}
			return query;
		},
		matchCriteria:{
				id:[0,-1],
				text:[0,-1],
				meta:[0,0],
				item_adjudication_amount_value:[-10, -15],
				default_value:[-1,-4]
		},
		calculateScore:function(orig, match, matchMatrix, patientRecord){
			return calcScore(orig, match, this.matchCriteria, matchMatrix, patientRecord);
		}
		
	},
	"DiagnosticOrder":{
		shared: true,
		searchQueryArray:function(obj, id){
			//if we are in the default set how do we want to search?
			var query = [];
			
			if (id !== undefined || obj.id !== undefined){
				var objectId = obj.resourceType+'/'+obj.id;
				if (id !== undefined){
					patientId = obj.resourceType+'/'+id;
				}
				query.push({_id: patientId});
			}
			return query;
		},
		matchCriteria:{
				id:[0,-1],
				text:[0,-1],
				meta:[0,0],
				item_code_text:{'type':'levenshtien', 'score':[0, -7]},
				default_value:[-6,-6]
		},
		calculateScore:function(orig, match, matchMatrix, patientRecord){
			return calcScore(orig, match, this.matchCriteria, matchMatrix, patientRecord);
		}
	},
	"MedicationOrder":{
		shared: true,
		searchQueryArray:function(obj, id){
			//if we are in the default set how do we want to search?
			var query = [];
			
			if (id !== undefined || obj.id !== undefined){
				var objectId = obj.resourceType+'/'+obj.id;
				if (id !== undefined){
					patientId = obj.resourceType+'/'+id;
				}
				query.push({_id: patientId});
			}
			return query;
		},
		matchCriteria:{
				id:[0,-1],
				text:[0,-1],
				meta:[0,0],
				reasonReference_reference:[-1,-1],
				medicationReference_reference:{
					'type':'reference',
					'field': 'code_coding_0_display',
					'score': [-6,-8]
				},
				code_coding_code:[0,-30],
				code_coding_display:[0,-20],
				default_value:[-1,-6]
		},
		calculateScore:function(orig, match, matchMatrix, patientRecord){
			return calcScore(orig, match, this.matchCriteria, matchMatrix, patientRecord);
		}
	},	
	"MedicationDispense":{
		shared: true,
		searchQueryArray:function(obj, id){
			//if we are in the default set how do we want to search?
			var query = [];
			
			if (id !== undefined || obj.id !== undefined){
				var objectId = obj.resourceType+'/'+obj.id;
				if (id !== undefined){
					patientId = obj.resourceType+'/'+id;
				}
				query.push({_id: patientId});
			}
			return query;
		},
		matchCriteria:{
				id:[0,-1],
				text:[0,-1],
				meta:[0,0],
				substitution_type_text:{'type':'levenshtien', 'score':[-10, -6]},
				default_value:[-6,-6]
		},
		calculateScore:function(orig, match, matchMatrix, patientRecord){
			return calcScore(orig, match, this.matchCriteria, matchMatrix, patientRecord);
		}
	},
	"MedicationStatement":{
		shared: true,
		searchQueryArray:function(obj, id){
			//if we are in the default set how do we want to search?
			var query = [];
			
			if (id !== undefined || obj.id !== undefined){
				var objectId = obj.resourceType+'/'+obj.id;
				if (id !== undefined){
					patientId = obj.resourceType+'/'+id;
				}
				query.push({_id: patientId});
			}
			return query;
		},
		matchCriteria:{
				id:[0,-1],
				text:[0,-1],
				meta:[0,0],
				medicationReference_reference: [-6, -15],
				note:{'type':'levenshtien', 'score':[0, -4]},
				default_value:[-6,-6]
		},
		calculateScore:function(orig, match, matchMatrix, patientRecord){
			return calcScore(orig, match, this.matchCriteria, matchMatrix, patientRecord);
		}
	},
	"Medication":{
		shared: true,
		searchQueryArray:function(med){
			return query.push(buildSystemAndCodeQueryArray(med.code, 'system', 'code'));	
		},
		matchCriteria:{
				id:[0,-1],
				text:[0,-1],
				meta:[0,0],
				code_coding_code:[0,-30],
				code_coding_display:[0,-20],
				code_text:{'type':'levenshtien', 'score':[-4, -6]},
				default_value:[-6,-6]
		},
		calculateScore:function(orig, match, matchMatrix, patientRecord){
			return calcScore(orig, match, this.matchCriteria, matchMatrix, patientRecord);
		}
	},	
	"Device":{
		shared: true,
		searchQueryArray:function(obj, id){
			//if we are in the default set how do we want to search?
			var query = [];
			
			if (id !== undefined || obj.id !== undefined){
				var objectId = obj.resourceType+'/'+obj.id;
				if (id !== undefined){
					patientId = obj.resourceType+'/'+id;
				}
				query.push({_id: patientId});
			}
			return query;
		},
		matchCriteria:{
				id:[0,-1],
				text:[0,-1],
				meta:[0,0],
				identifier:[-16,-30],
				type:[-16,-30],
				status:[-15,-30],
				default_value:[-6,-6]
		},
		calculateScore:function(orig, match, matchMatrix, patientRecord){
			return calcScore(orig, match, this.matchCriteria, matchMatrix, patientRecord);
		}
	},
	"Observation":{
		shared: true,
		searchQueryArray:function(obj, id){
			//if we are in the default set how do we want to search?
			var query = [];
			
			if (id !== undefined || obj.id !== undefined){
				var objectId = obj.resourceType+'/'+obj.id;
				if (id !== undefined){
					patientId = obj.resourceType+'/'+id;
				}
				query.push({_id: patientId});
			}
			return query;
		},
		matchCriteria:{
				id:[0,-1],
				text:[0,-1],
				meta:[0,0],
				reference:[-20,-20],
				abatementPeriod_start: [-15, -15],
				abatementPeriod_end: [-15, -15],
				code_coding_code:[-5, -30],
				code_coding_display: [-5, -20],	
				code_text:{'type':'levenshtien', 'score':[-10, -6]},
				effectiveDateTime:{
		        	'type':'date',
		        	'score':[-10, -6]
		        },
				effectivePeriod_start:{
		        	'type':'date',
		        	'score':[-5, -3]
		        },
				effectivePeriod_end:{
		        	'type':'date',
		        	'score':[-5, -3]
		        },
				valueQuantity_value:[-11, -11],
				default_value:[-6,-6]
		},
		calculateScore:function(orig, match, matchMatrix, patientRecord){
			return calcScore(orig, match, this.matchCriteria, matchMatrix, patientRecord);
		}
	},
	"AllergyIntolerance":{
		shared: true,
		searchQueryArray:function(obj, id){
			//if we are in the default set how do we want to search?
			var query = [];
			
			if (id !== undefined || obj.id !== undefined){
				var objectId = obj.resourceType+'/'+obj.id;
				if (id !== undefined){
					patientId = obj.resourceType+'/'+id;
				}
				query.push({_id: patientId});
			}
			return query;
		},
		matchCriteria:{
				id:[0,-1],
				text:[0,-1],
				meta:[0,0],
//				substance_text:{'type':'levenshtien', 'score':[-10, -6]},
				substance_coding_code:[-5, -30],
		        substance_coding:{'type':'code', 
		        	'originalMatch':'substance_coding_0_display',
		        	'displayMatch':'substance_text',
		        	'scoring':'standard',
		        	'score':[-1,-6]
		        },
		        substance_text:{'type':'code', 
		        	'displayMatch':'substance_coding_0_display',
		        	'originalMatch':'substance_text', 
		        	'scoring':'levenshtien',
		        	'ignoreOnMatch':true,
		        	'score':[-1,-1]
		        },	
		        reaction_onset:{
		        	'type':'date',
		        	'score':[-10, -6]
		        },
//				substance_coding_display: [-5, -20],
				default_value:[-1,-6]
		},
		calculateScore:function(orig, match, matchMatrix, patientRecord){
			return calcScore(orig, match, this.matchCriteria, matchMatrix, patientRecord);
		}
	},
	"ClinicalImpression":{
		shared: true,
		searchQueryArray:function(obj, id){
			//if we are in the default set how do we want to search?
			var query = [];
			
			if (id !== undefined || obj.id !== undefined){
				var objectId = obj.resourceType+'/'+obj.id;
				if (id !== undefined){
					patientId = obj.resourceType+'/'+id;
				}
				query.push({_id: patientId});
			}
			return query;
		},
		matchCriteria:{
				id:[0,-1],
				text:[0,-1],
				meta:[0,0],
				investigations:[-40, -40],
				problem:[-30,-7],
				default_value:[-6,-6]
		},
		calculateScore:function(orig, match, matchMatrix, patientRecord){
			return calcScore(orig, match, this.matchCriteria, matchMatrix, patientRecord);
		}
	},
	"Immunization":{
		shared: true,
		searchQueryArray:function(obj, id){
			//if we are in the default set how do we want to search?
			var query = [];
			
			if (id !== undefined || obj.id !== undefined){
				var objectId = obj.resourceType+'/'+obj.id;
				if (id !== undefined){
					patientId = obj.resourceType+'/'+id;
				}
				query.push({_id: patientId});
			}
			return query;
		},
		matchCriteria:{
				id:[0,-1],
				text:[0,-1],
				meta:[0,0],
				//if the coding is different it is very likely not a match
		        vaccineCode_coding_code:[-2, -60],
		        vaccineCode_coding_display:{'type':'levenshtien', 'score':[-1, -9]},
		        vaccineCode_text:{'type':'levenshtien', 'score':[-1, -6]},
		        route_coding:{'type':'code', 
		        	'originalMatch':'route_coding_0_display',
		        	'displayMatch':'route_text',
		        	'scoring':'standard','score':[-1,-6]
		        },
		        route_text:{'type':'code', 
		        	'displayMatch':'route_coding_0_display',
		        	'originalMatch':'route_text', 
		        	'scoring':'levenshtien',
		        	'ignoreOnMatch':true,
		        	'score':[-1,-1]},
		        vaccineCode_coding:{'type':'code', 
		        	'originalMatch':'vaccineCode_coding_0_display',
		        	'displayMatch':'vaccineCode_text',
		        	'scoring':'standard',
		        	'score':[-1,-6]},
		        vaccineCode_text:{'type':'code', 
		        	'displayMatch':'vaccineCode_coding_0_display',
		        	'originalMatch':'vaccineCode_text', 
		        	'ignoreOnMatch':true,
		        	'scoring':'levenshtien',
		        	'score':[-1,-1]},
		        date: {'type':'date',
		        	'score':[-10, -6]
		        },
		        wasNotGiven: [-10,-10],
				default_value:[-1,-4]
		},
		calculateScore:function(orig, match, matchMatrix, patientRecord){
			return calcScore(orig, match, this.matchCriteria, matchMatrix, patientRecord);
		}
	},
	"Condition":{
		shared: true,
		searchQueryArray:function(med){
			return query.push(buildSystemAndCodeQueryArray(med.code, 'system', 'code'));	
		},
		matchCriteria:{
				id:[0,-1],
				text:[0,-1],
				meta:[0,0],
				//if the coding is different it is very likely not a match
		        category_coding_code:[-2, -60],
		        //If code is missing then this is likely an empty revord, don't match
		        code:[-40, -8],
		        code_coding_code:[-2, -60],
		        code_coding_display:{'type':'levenshtien', 'score':[-40, -8]},
		        code_text:{'type':'levenshtien', 'score':[-4, -6]},
		        onsetDateTime:{
			        'type':'date',
		        	'score':[-10, -6]
		        },
				default_value:[-6,-6]
		},
		calculateScore:function(orig, match, matchMatrix, patientRecord){
			return calcScore(orig, match, this.matchCriteria, matchMatrix, patientRecord);
		}
	},
	"Location":{
		shared: true,
		searchQueryArray:function(obj, id){
			//if we are in the default set how do we want to search?
			var query = [];
			
			if (id !== undefined || obj.id !== undefined){
				var objectId = obj.resourceType+'/'+obj.id;
				if (id !== undefined){
					patientId = obj.resourceType+'/'+id;
				}
				query.push({_id: patientId});
			}
			return query;
		},
		matchCriteria:{
				id:[0,-1],
				text:[0,-1],
				meta:[0,0],
				//if the coding is different it is very likely not a match
		        type_coding_code:[-2, -60],
		        type_coding_display:[-2, -25],
		        name:{'type':'levenshtien', 'score':[-11, -6]},
		        address:[-11,-15],
		        telecom:[-11,-15],
		        identifier:[-11, -20],
				default_value:[-6,-6]
		},
		calculateScore:function(orig, match, matchMatrix, patientRecord){
			return calcScore(orig, match, this.matchCriteria, matchMatrix, patientRecord);
		}
	},
	"Practitioner":{
		shared: true,
		searchQueryArray:function(obj, id){
			//if we are in the default set how do we want to search?
			var query = [];
			
			if (id !== undefined || obj.id !== undefined){
				var objectId = obj.resourceType+'/'+obj.id;
				if (id !== undefined){
					patientId = obj.resourceType+'/'+id;
				}
				query.push({_id: patientId});
			}
			return query;
		},
		matchCriteria:{
				id:[0,-1],
				text:[0,-1],
				meta:[0,0],
		        practitionerRole: [-5, -11],
		        name:[-15,-20],
		        practitionerRole_specialty: [-10, -20],
		        practitionerRole_managingOrganization: [-11, -20],
		        identifier:[-11, -20],
		        address:[-11,-15],
		        telecom:[-11,-15],
				default_value:[-6,-6]
		},
		calculateScore:function(orig, match, matchMatrix, patientRecord){
			return calcScore(orig, match, this.matchCriteria, matchMatrix, patientRecord);
		}
	},
	"Organization":{
		shared: true,
		searchQueryArray:function(obj, id){
			//if we are in the default set how do we want to search?
			var query = [];
			
			if (id !== undefined || obj.id !== undefined){
				var objectId = obj.resourceType+'/'+obj.id;
				if (id !== undefined){
					patientId = obj.resourceType+'/'+id;
				}
				query.push({_id: patientId});
			}
			return query;
		},
		matchCriteria:{
				id:[0,-1],
				text:[0,-1],
				meta:[0,0],
				address_line:{'type':'levenshtien', 'score':[0, -6]},
				name:{'type':'levenshtien', 'score':[0, -6]},
				default_value:[-6,-6]
		},
		calculateScore:function(orig, match, matchMatrix, patientRecord){
			return calcScore(orig, match, this.matchCriteria, matchMatrix, patientRecord);
		}
	},
	"Patient":{
		shared: false,
		searchQueryArray:function(patient, id){
			var query = [];
			if (id !== undefined || patient.id !== undefined){
				var patientId = 'Patient/'+patient.id;
				if (id !== undefined){
					patientId = 'Patient/'+id;
				}
				query.push({_id: patientId});
			}

			
			var identifiers = patient.identifier;
			query.push(buildSystemAndCodeQueryArray(patient.identifier, 'identifier', 'value'));			
			//name+birthdate
			return query;
		},
		matchCriteria:{	
				id:[0,-5],
				text:[0,-1],
				address_line:{'type':'levenshtien', 'score':[0, -2]},
				meta_lastUpdated:[0,0],
				default_value:[-3,-3]
			
		},
		calculateScore:function(orig, match, matchMatrix, patientRecord){	
			return calcScore(orig, match, this.matchCriteria, matchMatrix, patientRecord);			
		}
		
	}
	
	
	
};

//shorthand function so the caller does not have to get the right def file
exports.calculateScore = function(lhs, rhs, matchMatrix, patientRecord){
	if (_.isUndefined(definitions[lhs.resourceType])){
		return definitions.default_definition.calculateScore(lhs, rhs, matchMatrix, patientRecord);	
	}
	return definitions[lhs.resourceType].calculateScore(lhs, rhs, matchMatrix, patientRecord);	
};


var buildSystemAndCodeQueryArray = function(theArray, fieldName, valueName){
	ret = { _count:1000};
	if (theArray.length == 1){
		ret[fieldName] = theArray[0].system+'|'+theArray[0][valueName];
//		console.log(JSON.stringify(ret));
		return ret;
	}else
	{
		qArray = [];
		for (i =0; i < theArray.length; i++){
			qArray.push(theArray[i].system+'|'+theArray[i][valueName]);
		}
		ret[fieldName] = {$or: qArray};
		return ret;
	}
};

//filter to remove numbers from an array
var tFilter = function(value){return !_.isNumber(value);};

var calcScore = function(orig, match, matchCriteria, matchMatrix, patientRecord){

		if (matchMatrix === undefined || matchMatrix === null)
			matchMatrix = {};
		
		var isOrg = orig.resourceType == 'Organization';
		
	    //ignoring the meta, extension, and id fields in the comparison since they are not really important.
		//less sure on ignoring text but I am going to for now.
		var differences = diff(orig, match, function(path, key){
			return (path.length === 0)&& (key =='meta'||key =='extension'||key=='id'||key=='text');
		});
	
		var score = 100;
		if (differences === undefined || differences === null){
			//exact match, give it a score of 100
			return { 'score':score, 'changes': ''} ;
		}
		
		for (var i=0; i < differences.length; i++){
			var difference = differences[i];
			var kind = difference.kind;
			//if it is a changed value we use the second element of the match array, 
			//otherwise it is new or absent so we use the first element
			
			//	N - indicates a newly added property/element
			//	D - indicates a property/element was deleted
			//	E - indicates a property/element was edited
			//	A - indicates a change occurred within an array
			var kind_index = kind =='E'?1:0;
			var path = difference.path;
			
			//for compiled path ignore the index for array objects

			
			
			var compiled_path = path.filter(tFilter);
			compiled_path = compiled_path.join('_');
			if (kind == 'E'){
				if (matchMatrix[difference.lhs] !== undefined && matchMatrix[difference.lhs] == matchMatrix[difference.rhs]){
					differences[i] = null;
				}else if	((difference.lhs instanceof Array && difference.lhs.length == 1)&& !(difference.rhs instanceof Array)){
					differences[i] = compareStringToArray(difference.rhs, difference.lhs);				
				}else if((difference.rhs instanceof Array && difference.rhs.length == 1)&& !(difference.lhs instanceof Array)){
					differences[i] = compareStringToArray(difference.lhs, difference.rhs);
				}else if (((_.isNumber(difference.rhs) && _.isString(difference.lhs)) || (_.isNumber(difference.lhs) && _.isString(difference.rhs))) &&
						compareNumberToString(difference.lhs, difference.rhs)){
	
					differences[i] = null;
				}else if(compareBooleanEquality(difference.lhs, difference.rhs)){
					differences[i] = null;
				}
			}
			
			//if difference is null then the only difference was an encapsulation in an array.  We are considering this a match.
			if (difference !== null){
				//check to see if there is a entry for the specific variable
				if (matchCriteria[compiled_path] !== undefined){	
					if (matchCriteria[compiled_path].type == 'levenshtien'){
						var distance = lev(difference.lhs, difference.rhs, true);
						if (distance === 0){
							differences[i] = null;
						}else{
							score += Math.min(5, distance)*matchCriteria[compiled_path].score[kind_index];
						}

					}else if (matchCriteria[compiled_path].type == 'reference') {
						if (kind === 'D' || kind === 'N'){
							score += matchCriteria[compiled_path].score[kind_index];
						}else{
							//handle the indirect reference.
							var leftRef = difference.lhs;
							var rightRef = difference.rhs;
							//get the referred to objects
							if (patientRecord !== null && !_.isUndefined(patientRecord.all)){
								var leftObj = patientRecord.all[leftRef];
								var rightObj = patientRecord.all[rightRef];
								
								//compare the specified field
								var fldPath = matchCriteria[compiled_path].field.split("_");
								var leftFldVal = getFldVal(fldPath, leftObj);
								var rightFldVal = getFldVal(fldPath, rightObj);								
								// if not match use levenshtein
								var distance = 1;
								//if one starts with the other treat distance as 1.
								if (leftFldVal.toLowerCase().lastIndexOf(rightFldVal.toLowerCase(), 0) === 0
										|| rightFldVal.toLowerCase().lastIndexOf(leftFldVal.toLowerCase(), 0) === 0){
									distance = 1;
								}else{
									//compare first words
									if (leftFldVal.split(" ")[0].toLowerCase() === rightFldVal.split(" ")[0].toLowerCase()){
										distance = 2;
									}else{
										distance = lev(leftFldVal, rightFldVal, true);
									}									
								}
								
								if (distance === 0){
									differences[i] = null;
								}else{
									score += Math.min(5, distance)*matchCriteria[compiled_path].score[kind_index];
								}
							}else{
								//what do we do if we don't have the record?
							}							
						}
					}else if (matchCriteria[compiled_path].type == 'date') {
						if (kind === 'D' || kind === 'N'){
							score += matchCriteria[compiled_path].score[kind_index];
						}else if ((difference.lhs.lastIndexOf(difference.rhs, 0) === 0) 
								||difference.rhs.lastIndexOf(difference.lhs, 0) === 0 ){
							
							//dates match
						}else{
							var lhsDates = difference.lhs.split('-');
							var lhsDayCount  = 0;
							var rhsDates = difference.rhs.split('-');
							var rhsDayCount  = 0;
							for (var x = 0; x < 2; x++){
								if (lhsDates.length > x){
									lhsDayCount += lhsDates[x]*daysToUse[x];
								}
								if (rhsDates.length > x){
									rhsDayCount += rhsDates[x]*daysToUse[x];
								}
								
							}

							score += Math.abs(lhsDayCount - rhsDayCount)*matchCriteria[compiled_path].score[kind_index];
							
						}
					} else if (matchCriteria[compiled_path].type == 'code'){
						var firstFld = matchCriteria[compiled_path].originalMatch.split("_");
						var secondFld = matchCriteria[compiled_path].displayMatch.split("_");
						
						
						if (kind === 'D'){
							var firstFldVal = getFldVal(firstFld, orig);
							var secondFldVal = getFldVal(secondFld, match);

							var distance = lev(firstFldVal, secondFldVal, true);
							if (distance === 0){
								if (matchCriteria[compiled_path].ignoreOnMatch){
									differences[i] = null;
								}else{
									var sfv = {};
									sfv[secondFld.pop()] = secondFldVal;
									firstFld.pop();
									differences[i] = {"changes":"E", "path":firstFld, "rhsPath":secondFld, "lhs":getFldVal(firstFld, orig), "rhs":getFldVal(secondFld, match)};
									score += matchCriteria[compiled_path].score[kind_index];
								}

							}else{
								score += Math.min(5, distance)*matchCriteria[compiled_path].score[kind_index];
							}			

						}else if (kind === 'N'){
							var firstFldVal = getFldVal(firstFld, match);
							var secondFldVal = getFldVal(secondFld, orig);
							
							var distance = lev(firstFldVal, secondFldVal, true);
							if (distance === 0){
								if (matchCriteria[compiled_path].ignoreOnMatch){
									differences[i] = null;
								}else{
									var ffv = {};
									ffv[firstFld.pop()] = firstFldVal;
									secondFld.pop();
									differences[i] = {"changes":"E", "path":secondFld, "rhhsPath":firstFld, "lhs":getFldVal(firstFld, orig), "rhs":ffv};
									score += matchCriteria[compiled_path].score[kind_index];

								}
							}else{
								score += Math.min(5, distance)*matchCriteria[compiled_path].score[kind_index];
							}	

							//get alt fld from lhs
						}else{
//							treat like a normal comparison
							if ('levenshtien' === matchCriteria[compiled_path].scoring){
								var distance = lev(difference.lhs, difference.rhs, true);
								if (distance === 0){
									differences[i] = null;
								}else{
									score += Math.min(5, distance)*matchCriteria[compiled_path].score[kind_index];
								}	
								
							}else{
								score += matchCriteria[compiled_path].score[kind_index];
							}
							

						}


					}else{
						score += matchCriteria[compiled_path][kind_index];
					}
					
				}else //check to see if there is an entry for the base path
				if (matchCriteria[path[0]] !== undefined){
					score += matchCriteria[path[0]][kind_index];
				}else{
					//use the default difference scoring
					score += matchCriteria.default_value[kind_index];
				}
			}
		}
		
		//remove any null entries from the differences array
		differences = differences.filter(function(value){return value !== null;});
		
		return { 'score':score, 'changes':differences};

};

/**
 * see if two boolean values are the same whether in String representation or as boolean primitives.
 */
var compareBooleanEquality = function(lhs, rhs){
	return ((lhs === true|| lhs === 'true') &&(rhs === true || rhs === 'true' )||
			(lhs === false ||lhs === 'false') &&(rhs === false || rhs === 'false' ));
	
};


/**
 * see if an array object is a single entry that is the same as the string
 */
var compareStringToArray = function(string, array){

	var tempDiff = diff(string, array[0]);
	if (tempDiff === undefined || tempDiff === null){
		return null;
	}else
		return tempDiff;

};

var daysToUse = [365,30,1];

var compareNumberToString = function(lhs, rhs){
	var templhs, temprhs;
	if (_.isNumber(lhs)){
		templhs = lhs;
	}else{
		templhs = parseFloat(lhs);
	}
	
	if (_.isNumber(rhs)){
		temprhs = rhs;
	}else{
		temprhs = parseFloat(rhs);
	}
	return templhs == temprhs;
	
};


var getFldVal = function(fldPath, retVal){
	
	for(var q=0; q < fldPath.length;q++){
		if (!_.isUndefined(retVal)){
			retVal = retVal[fldPath[q]];
		}
		
	}
	
	return retVal;
	
}