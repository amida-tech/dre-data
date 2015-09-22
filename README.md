# FHIR-Merge
	
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
		//entry will be an array of object IDs corresponding to the transaction processed.
}, function(error){

} );	
			
```

### Deduplicate a patient

```javascript

client.deduplicate(patientId, function(errs, matchSet){
	
		// match set will be a javascript object following the structure below
});

```

matchSet:

- `changeType` - 
-- match - for an object for which an exact match or matches has been found
-- update - for an object for which a partial match has been found
-- new - for an object for which no matches or partial matches has been found
- `lhs` - the originating object. 
- `rhs` - only present for changeType update, this is the partial match to the lhs object
- `matches` - only present for changeType match, this will contain an array of objects that match the lhs object


```json

[
  {
    "changeType": "match",
    "lhs": {
      "resourceType": "Condition",
      "id": "450",
      "meta": {
        "versionId": "1",
        "lastUpdated": "2015-09-21T14:42:59.442+00:00"
      },
      "patient": {
        "reference": "Patient/dupe"
      },
      "code": {
        "coding": [
          {
            "system": "http://snomed.info/sct",
            "code": "233604007",
            "display": "Pneumonia"
          }
        ]
      },
      "category": {
        "coding": [
          {
            "system": "http://snomed.info/sct",
            "code": "404684003",
            "display": "Finding"
          }
        ]
      },
      "clinicalStatus": "completed",
      "onsetPeriod": {
        "start": "2007-01-03"
      }
    },
    "matches": [
      {
        "resourceType": "Condition",
        "id": "372",
        "meta": {
          "versionId": "1",
          "lastUpdated": "2015-09-21T14:42:58.833+00:00"
        },
        "patient": {
          "reference": "Patient/dupe"
        },
        "code": {
          "coding": [
            {
              "system": "http://snomed.info/sct",
              "code": "233604007",
              "display": "Pneumonia"
            }
          ]
        },
        "category": {
          "coding": [
            {
              "system": "http://snomed.info/sct",
              "code": "404684003",
              "display": "Finding"
            }
          ]
        },
        "clinicalStatus": "completed",
        "onsetPeriod": {
          "start": "2007-01-03"
        }
      }
    ]
  },
  {
    "changeType": "match",
    "lhs": {
      "resourceType": "Observation",
      "id": "386",
      "meta": {
        "versionId": "1",
        "lastUpdated": "2015-09-21T14:42:58.684+00:00"
      },
      "code": {
        "coding": [
          {
            "system": "http://snomed.info/sct",
            "code": "409586006",
            "display": "Complaint"
          }
        ]
      },
      "valueCodeableConcept": {
        "coding": [
          {
            "system": "http://snomed.info/sct",
            "code": "233604007",
            "display": "Pneumonia"
          }
        ]
      },
      "appliesPeriod": {
        "start": "2008-01-03",
        "end": "2008-01-03"
      },
      "status": "completed",
      "identifier": [
        {
          "value": "ab1791b0-5c71-11db-b0de-0800200c9a66"
        }
      ],
      "subject": {
        "reference": "Patient/dupe"
      }
    },
    "matches": [
      {
        "resourceType": "Observation",
        "id": "464",
        "meta": {
          "versionId": "1",
          "lastUpdated": "2015-09-21T14:42:59.373+00:00"
        },
        "code": {
          "coding": [
            {
              "system": "http://snomed.info/sct",
              "code": "409586006",
              "display": "Complaint"
            }
          ]
        },
        "valueCodeableConcept": {
          "coding": [
            {
              "system": "http://snomed.info/sct",
              "code": "233604007",
              "display": "Pneumonia"
            }
          ]
        },
        "appliesPeriod": {
          "start": "2008-01-03",
          "end": "2008-01-03"
        },
        "status": "completed",
        "identifier": [
          {
            "value": "ab1791b0-5c71-11db-b0de-0800200c9a66"
          }
        ],
        "subject": {
          "reference": "Patient/dupe"
        }
      }
    ]
  },
  {
    "changeType": "new",
    "lhs": {
      "resourceType": "Patient",
      "id": "dupe",
      "meta": {
        "versionId": "2",
        "lastUpdated": "2015-09-21T14:42:59.248+00:00"
      },
      "extension": [
        {
          "url": "http://hl7.org/fhir/StructureDefinition/us-core-religion",
          "valueCodeableConcept": {
            "coding": [
              {
                "system": "urn:oid:2.16.840.1.113883.5.1076",
                "code": "1013",
                "display": "Christian (non-Catholic, non-specific)"
              }
            ]
          }
        },
        {
          "url": "http://hl7.org/fhir/Profile/us-core#race",
          "valueCodeableConcept": {
            "coding": [
              {
                "system": "urn:oid:2.16.840.1.113883.6.238",
                "code": "2106-3",
                "display": "White"
              }
            ]
          }
        },
        {
          "url": "http://hl7.org/fhir/Profile/us-core#ethnicity",
          "valueCodeableConcept": {
            "coding": [
              {
                "system": "urn:oid:2.16.840.1.113883.6.238",
                "code": "2186-5",
                "display": "Not Hispanic or Latino"
              }
            ]
          }
        },
        {
          "url": "http://hl7.org/fhir/StructureDefinition/birthPlace",
          "valueAddress": {
            "city": "Beaverton",
            "state": "OR",
            "postalCode": "97867",
            "country": "US"
          }
        }
      ],
      "text": {
        "status": "generated",
        "div": "<div><div class=\"hapiHeaderText\"> Isabella Isa <b>JONES </b></div><table class=\"hapiPropertyTable\"><tbody><tr><td>Identifier</td><td>998991</td></tr><tr><td>Address</td><td><span>1357 Amber Drive </span><br /><span>Beaverton </span><span>OR </span><span>US </span></td></tr><tr><td>Date of birth</td><td><span>01 May 1975</span></td></tr></tbody></table></div>"
      },
      "identifier": [
        {
          "system": "urn:oid:2.16.840.1.113883.19.5.99999.2",
          "value": "998991"
        },
        {
          "system": "urn:oid:2.16.840.1.113883.4.1",
          "value": "111-00-2330"
        }
      ],
      "name": [
        {
          "use": "usual",
          "family": [
            "Jones"
          ],
          "given": [
            "Isabella",
            "Isa"
          ]
        }
      ],
      "telecom": [
        {
          "system": "phone",
          "value": "(816)276-6909",
          "use": "home"
        }
      ],
      "gender": "female",
      "birthDate": "1975-05-01",
      "address": [
        {
          "use": "home",
          "line": [
            "1357 Amber Drive"
          ],
          "city": "Beaverton",
          "state": "OR",
          "postalCode": "97867",
          "country": "US"
        }
      ],
      "maritalStatus": {
        "coding": [
          {
            "system": "urn:oid:2.16.840.1.113883.5.2",
            "code": "M",
            "display": "Married"
          }
        ]
      },
      "contact": [
        {
          "relationship": [
            {
              "coding": [
                {
                  "system": "urn:oid:2.16.840.1.113883.5.111",
                  "code": "PRN",
                  "display": "Parent"
                }
              ]
            }
          ],
          "name": {
            "family": [
              "Jones"
            ],
            "given": [
              "Ralph"
            ]
          },
          "telecom": [
            {
              "system": "phone",
              "value": "(816)276-6909",
              "use": "home"
            }
          ],
          "address": {
            "line": [
              "1357 Amber Drive"
            ],
            "city": "Beaverton",
            "state": "OR",
            "postalCode": "97867",
            "country": "US"
          }
        },
        {
          "relationship": [
            {
              "coding": [
                {
                  "system": "urn:oid:2.16.840.1.113883.5.111",
                  "code": "GUAR"
                }
              ]
            }
          ],
          "name": {
            "family": [
              "Everyman"
            ],
            "given": [
              "Adam",
              "Frankie"
            ]
          },
          "telecom": [
            {
              "system": "phone",
              "value": "(781)555-1212",
              "use": "home"
            }
          ],
          "address": {
            "use": "home",
            "line": [
              "17 Daws Rd."
            ],
            "city": "Blue Bell",
            "state": "MA",
            "postalCode": "02368",
            "country": "US"
          }
        }
      ],
      "communication": [
        {
          "language": {
            "coding": [
              {
                "code": "en"
              }
            ]
          },
          "preferred": true
        }
      ],
      "managingOrganization": {
        "reference": "Organization/413"
      }
    }
  },
  {
    "changeType": "new",
    "lhs": {
      "resourceType": "Organization",
      "id": "413",
      "meta": {
        "versionId": "1",
        "lastUpdated": "2015-09-21T14:42:59.243+00:00"
      },
      "name": "Community Health and Hospitals",
      "telecom": [
        {
          "system": "phone",
          "value": " 555-555-5000",
          "use": "work"
        }
      ],
      "address": [
        {
          "line": [
            "1001 Village Avenue"
          ],
          "city": "Portland",
          "state": "OR",
          "postalCode": "99123",
          "country": "US"
        }
      ]
    }
  }
]


```
