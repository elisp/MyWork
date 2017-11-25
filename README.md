# Readers–writer lock

## Mission
Wtrite a class with two methods:
- ```Read``` this will read something from some resource and will allow multiple reads but *no write* is allowed as long as there are threads reading.  *No Read allowed* during ```write``` operaation
- ```Write``` will write something to a resource.  During write operation *no other writes nor any reads allowed*

## Requirement
Use mutex class and make sure the code is fully thread safe.
