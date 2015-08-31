var diff = require('deep-diff').diff;



exports.definitions = {
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
			meta_lastUpdated:[0,0],
			default_value:[-1,-4]
		
		},
		calculateScore:function(orig, match){
			return calcScore(orig, match, this.matchCriteria);
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
				meta_lastUpdated:[0,0],
				default_value:[-1,-4]
		},
		calculateScore:function(orig, match){
			return calcScore(orig, match, this.matchCriteria);
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
				meta_lastUpdated:[0,0],
				default_value:[-1,-2.5]
			
		},
		calculateScore:function(orig, match){

			return calcScore(orig, match, this.matchCriteria);
//			var differences = diff(orig, match);
//			var score = 100;
//			if (differences === undefined || differences == null){
//				//exact match, give it a score of 100
//				return { 'score':score, 'changes': ''} ;
//			}
//			
//			for (var i=0; i < differences.length; i++){
//				var difference = differences[i];
//				var kind = difference.kind;
//				//if it is a changed value we use the second element of the match array, 
//				//otherwise it is new or absent so we use the first element
//				
////				N - indicates a newly added property/element
////				D - indicates a property/element was deleted
////				E - indicates a property/element was edited
////				A - indicates a change occurred within an array
//				var kind_index = kind =='E'?1:0;
//				var path = difference.path;
//				var compiled_path = path.join("_");
//				//check to see if there is a entry for the specific variable
//				if (this.matchCriteria[compiled_path] !== undefined){
//					score += this.matchCriteria[compiled_path][kind_index];
//				}else //check to see if there is an entry for the base path
//				if (this.matchCriteria[path[0]] !== undefined){
//					score += this.matchCriteria[path[0]][kind_index];
//				}else{
//					//use the default difference scoring
//					score += this.matchCriteria.default_value[kind_index];
//				}
//			}
//			
//			return { 'score':score, 'changes':differences};
			
		}
		
	}
}


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
		ret[fieldName] = {$or: qArray}
		return ret;
	}
}


var calcScore = function(orig, match, matchCriteria){

		var differences = diff(orig, match);
		var score = 100;
		if (differences === undefined || differences == null){
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
			var compiled_path = path.join("_");

			
			if (kind == 'E'){
				if	((difference.lhs instanceof Array && difference.lhs.length == 1)&& !(difference.rhs instanceof Array)){
					var tempDiff = diff(difference.lhs[0], difference.rhs);
					
					if (tempDiff === undefined || tempDiff == null){
						differences[i] = null;
					}else 
						differences[i] = tempDiff;
					
					difference = differences[i];
					
				}else if((difference.rhs instanceof Array && difference.rhs.length == 1)&& !(difference.lhs instanceof Array)){
					differences[i] = null;
					var tempDiff = diff(difference.lhs, difference.rhs[0]);
					if (tempDiff === undefined || tempDiff == null){
						differences[i] = null;
					}else
						differences[i] = tempDiff;
					
					difference = differences[i];
				
				}//FIXME: There has to be a better way of doing this comparison.
				else if((difference.lhs === 'true' && difference.rhs === true)
					||(difference.lhs === 'false' && difference.rhs === false)
					||(difference.rhs === 'true' && difference.lhs === true)
					||(difference.rhs === 'false' && difference.lhs === false)){
					differences[i] = null;
				}
				
			}
		

			
			//if difference is null then the only difference was an encapsulation in an array.  We are considering this a match.
			if (difference != null){
				//check to see if there is a entry for the specific variable
				if (matchCriteria[compiled_path] !== undefined){
					score += matchCriteria[compiled_path][kind_index];
				}else //check to see if there is an entry for the base path
				if (matchCriteria[path[0]] !== undefined){
					score += matchCriteria[path[0]][kind_index];
				}else{
					//use the default difference scoring
					score += matchCriteria.default_value[kind_index];
				}
			}
			

		}
		
		differences = differences.filter(function(value){
			return value != null;
		});
		
		return { 'score':score, 'changes':differences};

}