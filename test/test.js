var assert = require("chai").assert;
var expect = require("chai").expect;
var fs = require('fs');
var diff = require('deep-diff').diff;
var factory = require('../lib/client');

var basePatientId;

describe('Insert', function(){
	describe('Insert a patient record', function(){
		it('should insert a record into the database', function(done){
			var patient = JSON.parse(fs.readFileSync('test/artifacts/patient/patient0.json', 'utf8'));
			//explicitly disabling provenance
			var client = factory.getClient('http://localhost:8080/fhir-test/base', null);
			client.create(patient, null, function(entry){
				//check for values?  can't gaurantee id value since that is dependent on state of server.
				assert.isNotNull(entry, 'Returned null patient entry.');
			
				var components = entry.match(/(.*)\/(.*)\/_history\/(.*)/);
				assert.equal(components[1], 'Patient');
				basePatientId = components[2];
				
				done();
			}, function(error){
				assert.fail('success response', 'error', 'failed to create patient entrty.');
				done();
			} );			
		});
	});
	
	describe('insert a bundle', function(){
		it('should insert a bundle', function(done){
			var source = fs.readFileSync('test/artifacts/bundle0.json', 'utf8');
			var bundle = JSON.parse(source);
			//explicitly disabling provenance
			var client = factory.getClient('http://localhost:8080/fhir-test/base', null);
			client.transaction(bundle, source, function(entry){
				//check for values?  can't gaurantee id value since that is dependent on state of server.
				assert.isNotNull(entry, 'Returned null transaction list entry.');
				done();
			}, function(error){
				assert.fail('success response', 'error', 'failed to complete transaction.');
				done();
			} );	
			
		});
	});
	
	describe('Insert a record into database with provenance', function(done){
		it('should insert a record and create a provenance entry for the insert', function(done){
			var source = fs.readFileSync('test/artifacts/patient/patient1-1.json', 'utf8');
			var patient = JSON.parse(source);
			var client = factory.getClient('http://localhost:8080/fhir-test/base');
			client.createWithProvenance(patient, source, function(entry, response, responseCode){
				//check for values?  can't guarantee id value since that is dependent on state of server.
				assert.isNotNull(entry, 'Returned null patient entry.');
				done();
			}, function(error){
				assert.fail('success resposne', 'error', 'failed to create patient entrty.');
				done();
			} );
		});
	});
// end insert
});

describe('Query', function(){
  describe('Get Patient record', function(){
	 it('should return a patient record', function(done){
		 var client = factory.getClient('http://localhost:8080/fhir-test/base');

		 client.getPatientRecord(basePatientId, function(err, bundle) {
				//do something with the bundle?
			 	var count = (bundle.entry && bundle.entry.length) || 0;
			  	assert.equal(1, count);
			  	var patient = bundle.entry[0].resource;
			  	assert.equal(patient.name[0].family, 'Hill');
			  	assert.equal(patient.name[0].given[0], 'Robert');
			  	
				done();
		 });
	 });
	 it('should return with search by patientId', function(done){
		 var client = factory.getClient('http://localhost:8080/fhir-test/base');
		 client.search('Patient', {identifier: {$exact:'urn:oid:0.1.2.3.4.5.6.7'+'|'+'1098667'}}, function(err, bundle){
			 	var count = (bundle.entry && bundle.entry.length) || 0;
			  	assert.isAbove(count, 0);	
			  	done();
		 });
	 });
  });
	 
	 describe('Get Medication', function(){ 
		 it('should return a medication by code', function(done){
			 var client = factory.getClient('http://localhost:8080/fhir-test/base');
			 
			 client.search("Medication", {code: {$exact:'http://www.nlm.nih.gov/research/umls/rxnorm|219483'}, _count: 1000}, function(err, bundle){
			 	var count = (bundle.entry && bundle.entry.length) || 0;
			  	assert.isAbove(count, 0);
				done();
			 });
			 
		 });
		 it('should return a medication by either of 2  codes', function(done){
			 var client = factory.getClient('http://localhost:8080/fhir-test/base');
			 
			 client.search("Medication", {code: {$or:
				 ['http://www.nlm.nih.gov/research/umls/rxnorm|219483', 
				  'http://www.nlm.nih.gov/research/umls/rxnorm|573621'
				  ]}, _count:1000}, function(err, bundle){
			 	var count = (bundle.entry && bundle.entry.length) || 0;
			  	assert.isAbove(count, 0);
				done();
			 });
			 
		 });
	 });
  
});


describe('Update', function(){
	describe('Update a Patient record ', function(){
		var source = fs.readFileSync('test/artifacts/patient/patient1-1.json', 'utf8');
		var patient = JSON.parse(source);
		var client = factory.getClient('http://localhost:8080/fhir-test/base', null);
		it('should create patient to be updated', function(done){
			//explicitly disabling provenance
			client.create(patient, null, function(entry){
				//check for values?  can't gaurantee id value since that is dependent on state of server.
				assert.isNotNull(entry, 'Returned null patient entry.');
				var components = entry.match(/((.*)\/(.*)\/_history\/(.*))/);
				var id = components[3];
				patient.id = id;
				done();
			}, function(error){
				assert.fail('success response', 'error', 'failed to create patient entrty.');
				done();
			} );	
			
		});
		
		it('Should update patient record', function(done){
			patient.birthDate = "1974-12-14"
			client.update(patient, null, function(entry){
				assert.isNotNull(entry, 'Returned null patient entry.');

				var components = entry.match(/(.*)\/(.*)\/_history\/(.*)/);
				assert.equal(components[1], 'Patient');
				assert.equal(components[2], patient.id);
				//since this is an update to a new record history should be 2
				assert.equal(components[3], 2);
				done();
			}, 
			function(error){
				assert.fail('success response', 'error', 'failed to create patient entrty.');
				done();
			});
		});
		
		it('should update a record and create a provenance entry for the update', function(done){

				patient.birthDate = "1974-12-15"
				client.updateWithProvenance(patient, source, function(entry, response, responseCode){
					//check for values?  can't guarantee id value since that is dependent on state of server.
					assert.isNotNull(entry, 'Returned null patient entry.');
					done();
				}, function(error){
					assert.fail('success resposne', 'error', 'failed to create patient entrty.');
					done();
				} );
		});
	});
});


describe('FindCandidates', function() {
	

	  describe('find prescriptions based on prescription object', function () {
		var count = 0; 

	  });
});


describe('addBundle', function() {
	

	  describe('insertBundle', function () {
		var count = 0; 

	  });
});

describe('Merge', function() {
	  
	  //id of the basic insert, which is in turn used for the basic search
	  
	  
	  describe('compare 2 equal objects', function () {
	    it('should return undefined when the values are equal', function () {
			var lhs = JSON.parse(fs.readFileSync('test/artifacts/medication/medication1-1.json', 'utf8'));
			var rhs = JSON.parse(fs.readFileSync('test/artifacts/medication/medication1-2.json', 'utf8'));
	      var differences = diff(lhs, rhs);
	      expect(differences).to.be.undefined;
	    });
	  });
	  
	  describe('compare edited objects', function () {
	    it('should return a difference file when the values are not equal', function () {
			var lhs = JSON.parse(fs.readFileSync('test/artifacts/medication/medication1-1.json', 'utf8'));
			var rhs = JSON.parse(fs.readFileSync('test/artifacts/medication/medication1-3.json', 'utf8'));

		    var differences = diff(lhs, rhs);
		    //confirm it sees the edit
			expect(differences).is.an('array').to.have.deep.property('[0].kind','E');
			expect(differences).to.have.deep.property('[0].rhs','Flucloxacillin222');
		      
	    });
	  });

	  describe('comparePatient', function(done){
		  var client = factory.getClient('http://localhost:8080/fhir-test/base', null);
		  var patient = JSON.parse(fs.readFileSync('test/artifacts/patient/patient0.json', 'utf8'));
		  console.log(">>"+basePatientId);
		  client.reconcile(patient, basePatientId, function(err, bundle) {
				//do something with the bundle?
			 	var count = (bundle.entry && bundle.entry.length) || 0;
			  	assert.equal(1, count);
			  	var patient = bundle.entry[0].resource;
			  	assert.equal(patient.name[0].family, 'Hill');
			  	assert.equal(patient.name[0].given[0], 'Robert');
			  	
				done();
		 });
		  
		  
		  
	  });
	});