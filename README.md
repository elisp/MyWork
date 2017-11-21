# Crawler

## Mission
To create a Crawler mechanism that will look for specific words in a given URL and go deeper with the links in the page until specific depth.

## Requirments
Write an API service that will have the ```ExtractInfoFromWebsite``` method that will get the following parameters

- ```url```, the url to start crawling with
- ```words```, a list of words to look for in the url and in the following links
- ```depth```, the depth of which to go forward in the crawling process

Processed pages should be kept in cache

Need to make sure no endless recursion will happen when parsing the same page more than once

There should be 2 keys in the configuration file

- ```MAX_AVAILABLE_THREADS```, number of threads to use for the crawling process
- ```URL_EXPIRATION_PERIOD```, number of minutes in which the url is cached
