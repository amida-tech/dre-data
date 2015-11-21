var assert = require("chai").assert;
var expect = require("chai").expect;
var rewire = require("rewire");
var fs = require('fs');
var diff = require('deep-diff').diff;
var factory = require('../lib/client');
var clientLib = rewire('../lib/client');
var mergeExtensions = clientLib.__get__('mergeExtensions');
var scoreRecord = clientLib.__get__('scoreRecord');
var spawn = require('child_process').spawnSync;
var basePatientId;
var lev = require('../lib/levenshtien').getEditDistance;
var dict = require('../lib/mergeDefinitions/definition');
var client = factory.getClient('http://localhost:8080/fhir-test/baseDstu2',null);


describe('fhir tests',function() {
	
			before('starting server', function() {
				var isWin = /^win/.test(process.platform);
				if (!isWin){
					//This should take between 8-12 seconds but slow computers may take longer
					this.timeout(24000);
					console.log('starting server');
					spawn('test/fhirServer/start.sh',['start']);
					console.log('started');
				}else{
					console.log('fhir server must be manually started on Windows systems.');
				}

		    });

			after('stopping server', function() {
				var isWin = /^win/.test(process.platform);
				if (!isWin){
					console.log('stopping server');
					spawn('test/fhirServer/start.sh',['stop']);    
					console.log('stopped');
				}else{

					console.log('fhir server must be manually stopped on Windows systems.');
				}
		    });
			
			describe('Matching', function() {
				it('should give a score of 100 when comparing the same record',function() {
					var original = JSON.parse(fs.readFileSync(
							'test/artifacts/matching/original.json','utf8'));
					var score = scoreRecord(original, original, {});
					assert.equal(score.score,100);
				});
				it('should give a score of less than 100 but greater than 0  when comparing a match',function() {
					var original = JSON.parse(fs.readFileSync(
							'test/artifacts/matching/original.json','utf8'));
					var match = JSON.parse(fs.readFileSync(
							'test/artifacts/matching/match.json','utf8'));
					var score = scoreRecord(original, match, {});
					assert.isBelow(score.score,100);
					assert.isAbove(score.score, 0);
				});
				it('should give a score of 0 when comparing a record flagged as a mismatch',function() {
					var original = JSON.parse(fs.readFileSync(
							'test/artifacts/matching/original.json','utf8'));
					var mismatch = JSON.parse(fs.readFileSync(
							'test/artifacts/matching/notMatch.json','utf8'));
					var score = scoreRecord(original, mismatch, {});
					assert.equal(score.score, 0);				
				});
				it('should give a score of 0 when comparing a mismatched record to a original',function() {
					var original = JSON.parse(fs.readFileSync(
							'test/artifacts/matching/original.json','utf8'));
					var mismatch = JSON.parse(fs.readFileSync(
							'test/artifacts/matching/notMatch.json','utf8'));
					var score = scoreRecord(mismatch, original, {});
					assert.equal(score.score, 0);	
				});
				it('should ignore extensions when doing a comparison',function() {
					var original = JSON.parse(fs.readFileSync(
							'test/artifacts/matching/original.json','utf8'));
					var second = JSON.parse(fs.readFileSync(
							'test/artifacts/matching/extensionOnlyDifference.json','utf8'));
					var score = scoreRecord(second, original, {});
					assert.equal(score.score, 100);	
				});
				
			});
			describe('Insert',	function() {
				describe( 'Insert a patient record',function() {
						it('should insert a record into the database',function(done) {
							var patient = JSON.parse(fs.readFileSync(
								'test/artifacts/patient/patient0.json','utf8'));
							// explicitly disabling provenance
							client.create(patient,null,function(entry) {
							// check for values? can't gaurantee id value
							// since that is dependent on state of server.
							assert.isNotNull(entry,'Returned null patient entry.');
							var components = entry.match(/(.*)\/(.*)\/_history\/(.*)/);

							assert.equal(components[1],'Patient');
							basePatientId = components[2];
	
							done();
						},
						function(error) {
							assert.fail('success response','error','failed to create patient entrty.');
							done();
						});
					});
				});

				describe('insert a bundle', function() {
					it('should insert a bundle',function(done) {
							this.timeout(4000);
							var source = fs.readFileSync('test/artifacts/bundle0.json','utf8');
							var bundle = JSON.parse(source);
							// explicitly disabling provenance
							client.transaction(bundle,source,function(entry) {
							// check for values? can't guarantee id value
							// since that is dependent on state of server.
							assert.isNotNull(entry,'Returned null transaction list entry.');
							done();
						},
						function(error) {
							assert.fail('success response','error','failed to complete transaction.');
							done();
						});
					});
				});

				describe('Insert a record into database with provenance', function(done) {
					it('should insert a record and create a provenance entry for the insert',function(done) {
//						console.log('FIXME!!!!!!!!!!!! the source attribute to the provenance is not updated')
							var source = fs.readFileSync('test/artifacts/patient/patient1-1.json','utf8');
							var patient = JSON.parse(source);
							client.createWithProvenance(patient,source,
								function(entry,response,responseCode) {
									// check for values? can't guarantee id value since
									// that is dependent on state of server.
									assert.isNotNull(entry,'Returned null patient entry.');
									done();
								},
								function(error) {
									assert.fail('success resposne','error','failed to create patient entrty.');
									done();
								});
						});
				});
				
				describe('Insert a transaction into database with provenance', function(done) {
					it('should insert a record and create a provenance entry for the insert',function(done) {
							this.timeout(4000);
							var source = fs.readFileSync('test/artifacts/bundle0.json','utf8');
							var patient = JSON.parse(source);
							client.transaction(patient,source,
								function(entry,response,responseCode) {
									// check for values? can't guarantee id value since
									// that is dependent on state of server.
									assert.isNotNull(entry,'Returned null patient entry.');
									done();
								},
								function(error) {
									assert.fail('success resposne','error','failed to create patient entrty.');
									done();
								});
						});
				});
						// end insert
			});

			describe('ExtensionHandling', function(){
				it('should not alter the primary record when neither has extensions', function(){
					var primary = JSON.parse(fs.readFileSync('test/artifacts/extensionHandling/noExtensions.json','utf8'));
					var secondary = JSON.parse(fs.readFileSync('test/artifacts/extensionHandling/noExtensions.json','utf8'));
					
					mergeExtensions(primary, secondary);
					assert.isUndefined(primary.extension);
					
				});
				
				it('should not alter the primary record when the secondary has no extensions', function(){
					var primary = JSON.parse(fs.readFileSync('test/artifacts/extensionHandling/primary.json','utf8'));
					var secondary = JSON.parse(fs.readFileSync('test/artifacts/extensionHandling/noExtensions.json','utf8'));
					
					var ext = primary.extension;
					mergeExtensions(primary, secondary);
					assert.deepEqual(ext, primary.extension);
				});
				
				it('should alter the primary record when the secondary has extensions but primary does not', function(){
					var primary = JSON.parse(fs.readFileSync('test/artifacts/extensionHandling/noExtensions.json','utf8'));
					var secondary = JSON.parse(fs.readFileSync('test/artifacts/extensionHandling/primary.json','utf8'));
					
					var ext = secondary.extension;
					mergeExtensions(primary, secondary);
					assert.deepEqual(ext, primary.extension);
				});
				
				it('should merge extensions with no duplicates where both records have same extensions', function(){
					var primary = JSON.parse(fs.readFileSync('test/artifacts/extensionHandling/primary.json','utf8'));
					var secondary = JSON.parse(fs.readFileSync('test/artifacts/extensionHandling/primary.json','utf8'));
					
					var ext = secondary.extension;
					mergeExtensions(primary, secondary);
					assert.deepEqual(ext, primary.extension);
				});
				
				it('should merge extensions where both records have extensions', function(){
					var primary = JSON.parse(fs.readFileSync('test/artifacts/extensionHandling/primary.json','utf8'));
					var secondary = JSON.parse(fs.readFileSync('test/artifacts/extensionHandling/someMatchingExtensions.json','utf8'));
					var result = JSON.parse(fs.readFileSync('test/artifacts/extensionHandling/combinedExtensionResult.json','utf8'));
					
					mergeExtensions(primary, secondary);
					assert.deepEqual(result, primary.extension);
				});
			});
			
			
			
			describe('Query',function() {
				describe('Get Patient record',function() {
					it('should return a patient record',function(done) {
							client.getPatientRecord(1,function(err,bundle) {
								// do something with the bundle?
								var count = (bundle.entry && bundle.entry.length) || 0;
								assert.equal(1, count);
								var patient = bundle.entry[0].resource;
								assert.equal(patient.name[0].family,'Hill');
								assert.equal(patient.name[0].given[0],'Robert');
								done();
							}, false);
					});
					it('should return with search by patientId',function(done) {
						client.search('Patient',
							{ identifier : { $exact : 'urn:oid:0.1.2.3.4.5.6.7|1098667'}},
							function(err,bundle) {
								var count = (bundle.entry && bundle.entry.length) || 0;
								assert.isAbove(count,0);
								done();
							});
					});
				});

				describe('Get Medication',function() {
					it('should return a medication by code', function(done) {
						client.search("Medication",
							{code : {$exact : 'http://www.nlm.nih.gov/research/umls/rxnorm|219483'},_count : 1000},
							function(err,bundle) {
								var count = (bundle.entry && bundle.entry.length) || 0;
								assert.isAbove(count,0);
								done();
							});

					});
					it('should return a medication by either of 2  codes', function(done) {

						client.search("Medication",
							{ 
								code : {
									$or : [
										'http://www.nlm.nih.gov/research/umls/rxnorm|219483',
										'http://www.nlm.nih.gov/research/umls/rxnorm|573621' 
									]
								},
								_count : 1000
							},
							function(err,bundle) {
								var count = (bundle.entry && bundle.entry.length) || 0;
								assert.isAbove(count,0);
								
								done();
							}
						);

					});
				});
			});

			describe('Update',function() {
				describe('Update a Patient record ', function() {
					var source = fs.readFileSync('test/artifacts/patient/patient1-1.json','utf8');
					var patient = JSON.parse(source);
									
					it('should create patient to be updated',function(done) {
						// explicitly disabling provenance
						client.create(patient,null,function(entry) {
							// check for values?
							// can't guarantee id value since
							// that is dependent on state of server.
							assert.isNotNull(entry,'Returned null patient entry.');
							var components = entry.match(/((.*)\/(.*)\/_history\/(.*))/);
							var id = components[3];
							patient.id = id;
							
							done();
						},
						function(error) {
							assert.fail('success response','error','failed to create patient entrty.');
								
							done();
						});

					});
					
					it('Should update patient record',function(done) {
						patient.birthDate = "1974-12-14";
						client.update(patient,null,function(entry) {
							assert.isNotNull(entry,'Returned null patient entry.');

							var components = entry.match(/(.*)\/(.*)\/_history\/(.*)/);
							assert.equal(components[1],'Patient');
							assert.equal(components[2],patient.id);
							// since this is an update to a new record
							// history should be 2.
							assert.equal(components[3],2);
							
							done();
						},
						function(error) {
							assert.fail('success response','error','failed to create patient entrty.');
																	
							done();
						});
					});

					it('should update a record and create a provenance entry for the update', function(done) {
						patient.birthDate = "1974-12-15";
						client.updateWithProvenance(patient,source,function(entry,response,responseCode) {
							// check for values? can't guarantee id value since
							// that is dependent on state of server.
							assert.isNotNull(entry,'Returned null patient entry.');
																		
							done();
						},
						function(error) {
							assert.fail('success response','error','failed to create patient entrty.');
							done();
						});
					});
				});
			});

			describe('FindCandidates', function() {
				describe('find prescriptions based on prescription object',function() {
					var count = 0;

				});
			});

			describe('addBundle', function() {
				describe('insertBundle', function() {
					var count = 0;
				});
			});

			describe('Merge',function() {
				describe('compare 2 equal objects', function() {
					it('should return undefined when the values are equal',function() {
						var lhs = JSON.parse(fs.readFileSync('test/artifacts/medication/medication1-1.json','utf8'));
						var rhs = JSON.parse(fs.readFileSync('test/artifacts/medication/medication1-2.json','utf8'));
						var differences = diff(lhs, rhs);
						var j = expect(differences).to.be.undefined;
					});
				});

				describe('compare edited objects',function() {
					it('should return a difference file when the values are not equal',function() {
						var lhs = JSON.parse(fs.readFileSync('test/artifacts/medication/medication1-1.json','utf8'));
						var rhs = JSON.parse(fs.readFileSync('test/artifacts/medication/medication1-3.json','utf8'));

						var differences = diff(lhs, rhs);
						// confirm it sees the edit
						expect(differences).is.an('array').to.have.deep.property('[0].kind','E');
						expect(differences).to.have.deep.property('[0].rhs','Flucloxacillin222');

					});
				});
				
				describe('compare objects with different order',function() {
					it('should return a difference file when the values are not equal',function() {
						var lhs = JSON.parse(fs.readFileSync('test/artifacts/generic/obj1.json','utf8'));
						var rhs = JSON.parse(fs.readFileSync('test/artifacts/generic/obj2.json','utf8'));

						var differences = diff(lhs, rhs);
						// confirm it sees the edit

					});
				});
				
				describe('compare objects with whitespace differences in properties',function() {
					it('should return a difference file when the values are not equal',function() {
						var lhs = JSON.parse(fs.readFileSync('test/artifacts/organization/organization0-1.json','utf8'));
						var rhs = JSON.parse(fs.readFileSync('test/artifacts/organization/organization0-2.json','utf8'));
						var vvv = dict.calculateScore(lhs, rhs, null);
						//ignoring whitespace in the address they should be equal
						assert.equal(100, vvv.score);
						
					});
				});
				
				describe('compare Prescription', function(){
					it('should return comparison', function(done){
						var pres1 = JSON.parse(fs.readFileSync('test/artifacts/prescription/prescription1-1.json','utf8'));
						var pres2 = JSON.parse(fs.readFileSync('test/artifacts/prescription/prescription1-2.json','utf8'));
						
						client.reconcile(pres1,1,function(err, bundle) {
							
//							assert.equal('update', bundle.changeType);
							done();
						});
						
					});
				});

				describe('compare Patient',function() {	
					
					
					var baseMergePatient = fs.readFileSync('test/artifacts/patient/patient0.json','utf8');
					var baseMergePatientId;
					
					it('should insert a record into the database',function(done) {
						var patient = JSON.parse(baseMergePatient);
						client.create(patient,null,function(entry) {
							// check for values? can't gaurantee id value
							// since that is dependent on state of server.
							assert.isNotNull(entry,'Returned null patient entry.');
	
							var components = entry.match(/(.*)\/(.*)\/_history\/(.*)/);
							assert.equal(components[1],'Patient');
							baseMergePatientId = components[2];
							done();
						},
						function(error) {
							assert.fail('success response','error','failed to create patient entry.');
							done();
						});
					});
					
					
					it('should return  a reconciliation set',function(done) {
						var patient = JSON.parse(fs.readFileSync('test/artifacts/patient/patient0-2.json','utf8'));
										
						client.reconcile(patient,baseMergePatientId,function(err, bundle) {
							
							assert.equal('update', bundle.changeType);
							done();
						});
					});
				});

				describe('reconcilePatientRecord',function() {
					var reconcilePatientId;
					var reconcilePatientId2;
					it('should insert a bundle for reconciliation', function(done){
						//giving additional time to complete because this is at the edge of 2 seconds
						this.timeout(4000);
						var source = fs.readFileSync('test/artifacts/bundle0.json','utf8');
						var bundle = JSON.parse(source);
						client.transaction(bundle,source,function(entry) {
							// check for values? can't guarantee id value
							// since that is dependent on state of server.
							assert.isNotNull(entry,'Returned null transaction list entry.');
							
							//find the patientID among the responses.
							for (var t =0; t < entry.length; t++){
								var components = entry[t].match(/(.*)\/(.*)\/_history\/(.*)/);
								if (components[1] == 'Patient'){
									reconcilePatientId = components[2];	
//									console.log('reconcile patient: '+reconcilePatientId+" "+entry[t]);
									break;
								}	
							}
							done();
						},
						function(error) {
							assert.fail('success response','error','failed to complete transaction.');
							done();
						});
				
						
					});
					//this is a repeat of the previous step, used so we can compare 2 patient records.
/*		*/			it('should insert a second bundle for reconciliation', function(done){
						this.timeout(4000);
						var source = fs.readFileSync('test/artifacts/bundle0.json','utf8');
						var bundle = JSON.parse(source);
						client.transaction(bundle,source,function(entry) {
							// check for values? can't guarantee id value
							// since that is dependent on state of server.
							assert.isNotNull(entry,'Returned null transaction list entry.');
							
							//find the patientID among the responses.
							for (var t =0; t < entry.length; t++){
								var components = entry[t].match(/(.*)\/(.*)\/_history\/(.*)/);
//								console.log('>>'+components);
								if (components[1] == 'Patient'){
									reconcilePatientId2 = components[2];	
//									console.log('reconcile patient: '+reconcilePatientId+" "+entry[t]);
									break;
								}	
							}
							done();
						},
						function(error) {
							assert.fail('success response','error','failed to complete transaction.');
							done();
						});
				
						
					});
					
					it ('should compare 2 patients with matching records and consider all elements a match', function(done){
						client.reconcilePatient(reconcilePatientId2,reconcilePatientId,function(err, bundle) {

							//TODO: insert some validation
							done();
						});
					});
					
					it('should return  a reconciliation set',function(done) {
						var source = fs.readFileSync('test/artifacts/bundle0.json','utf8');
						var bundle = JSON.parse(source);
						
						client.reconcilePatient(bundle,reconcilePatientId,function(err, bundle) {

							fs.writeFile('reconcile-0.json', JSON.stringify(bundle, null, 2), function (err) {
								  if (err) return console.log(err);
							});
							done();
						});
					});
					
					it('should create the patient to be deduplicated', function(done){
						this.timeout(3000);
						//create a record
						var source = fs.readFileSync('test/artifacts/deduplicationBundle.json','utf8');
						var patient = JSON.parse(source);
						client.transaction(patient,null,function(entry) {
							done();
						});
						
					});
					
					it('should return  a reconciliation set from dedupe user',function(done) {
						this.timeout(3000);
						//create a record
						var source = fs.readFileSync('test/artifacts/deduplicationBundle.json','utf8');
						var patient = JSON.parse(source);
						var bundle = JSON.parse(source);
						
						client.reconcilePatient(bundle,'dupe',function(err, bundle) {
							//TODO: insert some validation
//							console.log("response: "+JSON.stringify(bundle));
							fs.writeFile('reconcile-dupe-0.json', JSON.stringify(bundle, null, 2), function (err) {
								  if (err) return console.log(err);
							});
							// do something with the bundle?
//							var count = (bundle.entry && bundle.entry.length) || 0;
//							assert.equal(1, count);
//							var patient = bundle.entry[0].resource;
//							assert.equal(patient.name[0].family,'Hill');
//							assert.equal(patient.name[0].given[0],'Robert');
							done();
						});

					});					
					
					it('should add duplicate elements to the patient', function(done){
						this.timeout(3000);
						//create a record
						var source = fs.readFileSync('test/artifacts/deduplicationBundle.json','utf8');
						var patient = JSON.parse(source);
						client.transaction(patient,null,function(entry) {
							
							done();
						});
						
					});
					
					it('should create a deduplication reconciliation set', function(done){
						this.timeout(8000);
						client.deduplicate('dupe', function(errs, matchSet){
							fs.writeFile('matchSet-0.json', JSON.stringify(matchSet, null, 2), function (err) {
								  if (err) return console.log(err);
							});
							done();
						});

						
					});

					
					it('should consolidate duplicates', function(done){
						this.timeout(4000);
						setTimeout(
						client.removeMatches('dupe', function(err, matchSet){
							fs.writeFile('matchSet-42.json', JSON.stringify(matchSet, null, 2), function (err) {
								  if (err) return console.log(err);
							});	
							done();
						}),3000);
						
						
					});
					

					it('should merge changes for resource', function(done){
						this.timeout(2000);
						//read file
						var source = fs.readFileSync('test/artifacts/updatePostMatch.json','utf8');
						client.merge(source, 3189, function(err, success){
							//get the record and confirm it is changed
							client.getRecord("Immunization", 3779, function(err, success){
								assert.equal(1,success.entry.length, 1);
								assert.equal(3779,success.entry[0].resource.id );
								assert.equal(23, success.entry[0].resource.lotNumber);
								done();
							});
							
						});
					});
									
				});
			});
		});