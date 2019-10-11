# InspectAllOrgs
The coveo-implementation-checker (the non-Chrome version) will inspect all production orgs.

## Organizations
Checks all Coveo Organizations. Is it properly configured, Sources, Analytics, Query Pipelines.
*Since the automated checker does normally not have access to Content/Log browser data certain checks are not being made

The following checks are made:

Sources
- Types of connectors used
- Contains Push sources
- Contains Crawling modules
- Sources without refresh schedules
- Security Identity errors
- Security Provider Schedules. Are they configured, if so are they enabled
- Nr of Security Identities

Search
- Nr of Query pipelines
- % Using Facets, Different Search Interface, QuerySuggest, FieldQuerySuggest, Sorting
- Based upon Analytics we first retrieve the used Query Pipelines, those are being used for the below checks
- For each query pipeline:
  *We check the /Models/Details for the number of candidates for each ML model being used. If this is < 10 then it is considered as 'Not properly configured'
- ML, Version
- ML, Query Suggest enabled
- ML, ART enabled
- ML, Recommendations enabled
- Nr of Thesaurus entries
- Ranking expressions. For each expression a Query Check is made
- Filter expressions. For each expression a Query Check is made
- Warning if a filter is applied, need to set the query pipeline in the search token
- Nr of Featured results

Analytics
- Top Queries
- Empty Hubs
- Click Rank, last week
- Click Through, last week
- No of Searches, last week
- Avg Response Time
- Based upon Analytics we gather the Search Interface URL's. Those are being used to create mobile/normal screenshots.

Salesforce
- After all Analysis is done, Salesforce is being updated.
- If a Customer Implementation project is found, it is updated. If not, we check for a Cloud Organization.

## Installation
Dependencies:
```
npm install puppeteer
npm i -S image-hash
npm install node-salesforce
```

Node.js application. In the results directory the output is written.

- `debug` in InspectAllOrgs.js can be set to get additional debug info.
- `nrofdaysAnalytics` is used to retrieve the nr of days for the Analytics.
- `s3Loc` location pointing to the S3 location of the output.html results.
- `addGoogleSheet` if all info also needs to be written to a Google Sheet.

Speed, the application processes around 2 orgs a minute.

### Upload to S3
After execution you need to upload the output directory to the S3 location.
Execute `uploadToS3.bat`.

### Secret file
Inside the [secret file](secrets\settings.json) you need to define the following JSON:
```
{
  "apiKey": "",
  "baseUrl": "https://platform.cloud.coveo.com",
  "baseUrlAnalytics": "https://platform.cloud.coveo.com",
  "SFDC_Pass": "PASSSECURITYTOKEN",
  "Normal_Pass": "PASS",
  "SFDC_User": "USER@COVEO.COM"
}
```

- `apiKey` can be empty
- `baseUrl` see above
- `baseUrlAnalytics` see above
- `SFDC_Pass` should contain your salesforce password, followed by your security token
- `Normal_Pass` your normal (Coveo Password)
- `SFDC_User` your normal/Salesforce username


## Changes
1.0 Initial version