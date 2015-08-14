# FHIR-Merge



## Goals:
(flesh out more)
- Audit Trail (provenance)
    - Use Fhir provenance to include an audit trail for a commit if possible
	- If not create a generic provenance entry?
- Commit history
	- Keep a history of the change, need to determine where
	    - not necessary, see history: https://www.hl7.org/fhir/http.html#history
	- Keep the file that was commited in mongo
	- Create provenance record for the update, link to authenticated user and file as stored in mongo
	    - https://www.hl7.org/fhir/provenance.html
	
	
- elements I want to focus on first:
	- Prescription
	- MedicationDispense
	- Medication - no merge?
	- MedicationAdministration
	- Observation
	- Patient
	- Contact

	
## Usage

### Create a client

client = getClient('http://myFhirServer.com/base');

### Create a new entry

- `fhirObject` - fhir object to be serialized
- `source` - source file.  if present the source file will be serialized as a binary object

```javascript

client.create(fhirObject, source
 function(objectId){
 	//returns the id of the created object.  e.g. Patient/1/_history/1
    console.log(objectId)
 },
 function(error){
   console.error(error)
 });
 
```
### Update an entry

- `fhirObject` - fhir object to be serialized
- `source` - source file.  if present the source file will be serialized as a binary object


```javascript

client.create(fhirObject, source
 function(objectId){
 	//returns the id of the created object.  e.g. Patient/1/_history/1
    console.log(objectId)
 },
 function(error){
   console.error(error)
 });
 
 ```
 
 
### Execute transaction

- `bundle` - a valid fhir transaction object
- `source` - source file used to create the transaction (optional)

```javascript

 client.transaction(bundle, source, function(entry){
		//entry will be an array of object IDs corresponding to the trnasaction processed.
}, function(error){

} );	
			
```


