#!/bin/bash
cd "$(dirname "$0")"

case "$1" in
    start)

    # first kill any servers that may be running 
    pkill -f "java -jar fhirTest-0.0.2-SNAPSHOT.jar hapi-fhir-test-memory.war"
    # start the server
    java -jar fhirTest-0.0.2-SNAPSHOT.jar hapi-fhir-test-memory.war > server.log 2>&1 &
    # follow the log file until the server is started
    echo "starting server"
    tail -f server.log | while read LOGLINE
    do
        [[ "${LOGLINE}" == *"Server:main: Started @"* ]] && pkill -P $$ tail
    done

    echo "server started"
    ;;
    stop)
    pkill -f "java -jar fhirTest-0.0.2-SNAPSHOT.jar hapi-fhir-test-memory.war"
    ;;
    *)
    echo "Usage: $0 {start|stop}"
    exit 1
    ;;
esac

exit 0
