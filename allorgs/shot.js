// npm install puppeteer
// npm i -S image-hash
// npm install node-salesforce
// npm install sharp
var sf = require("node-salesforce");
const fs = require("fs");

const puppeteer = require("puppeteer");
var pHash = require("image-hash");
const sharp = require("sharp");
var url = "https://midatlantic.aaa.com/search%20results?";
//url = 'https://ikb.vmware.com/';
//url = 'https://inside.qa02.corp.adobe.com/content/inside/en/search.html';
url = "https://search.aarp.org/gss/everywhere?q=games&intcmp=DSO-SRCH-EWHERE";
//url = 'https://search.aarp.org/gss/everywhere?q=games&intcmp=DSO-SRCH-EWHERE';
//url = 'https://new.aba.com/member-tools/industry-solutions';
//url = 'https://www.andersenwindows.com/search';
url = "https://www.amfam.com/search#q=report%20in%20";
url = "https://www.aota.org/";
url = "https://www.al-enterprise.com/en/search";
url = "https://kb.vmware.com/s/global-search/%40uri";
var SFDCConnection;

/*
var fileOnServer = '/home/ubuntu/myuploaddir/randomfile/randomimage.jpg',
    fileName = 'MyRandomImage.jpg',
    fileType = 'image/jpeg';

fs.readFile(fileOnServer, function (err, filedata) {
    if (err){
        console.error(err);
    }
    else{
        var base64data = new Buffer(filedata).toString('base64');
        jsForceConn.sobject('Attachment').create({ 
                ParentId: 'mysalesforceContactID',
                Name : fileName,
                Body: base64data,
                ContentType : fileType,  
            }, 
            function(err, uploadedAttachment) {
                console.log(err,uploadedAttachment);
        });
}
});
*/
hammingDistance = (str1, str2) => {
  /* If the strings are equal, bail */
  if (str1 === str2) {
    return 0;
  }

  /*If the lengths are not equal, there is no point comparing each character.*/
  if (str1.length != str2.length) {
    return false;
  }

  /*loop here to go through each position and check if both strings are equal.*/
  var numDiffChar = 0;
  var index = 0;
  while (index < str1.length) {
    if (str1.charAt(index) !== str2.charAt(index)) {
      numDiffChar++;
    }
    index++;
  }
  return numDiffChar;
};

// function to encode file data to base64 encoded string
getImage64 = file => {
  // read binary data
  var bitmap = fs.readFileSync(file);
  // convert binary data to base64 encoded string
  return new Buffer(bitmap).toString("base64");
};
getHTML = file => {
  // read binary data
  var bitmap = fs.readFileSync(file);
  // convert binary data to base64 encoded string
  return new Buffer(bitmap).toString();
};

myimageHash = file => {
  let mydata = 0;
  let promise = new Promise(resolve => {
    let mydata2 = pHash.imageHash(file, 32, true, (error, data) => {
      //if (error) throw error;
      //console.log(data);
      mydata = data;
      resolve(mydata);
      //return Promise.resolve(mydata);
      // 0773063f063f36070e070a070f378e7f1f000fff0fff020103f00ffb0f810ff0
    });
  });
  return promise;
  //return mydata;
};

getHost = url => {
  // run against regex
  const matches = url.match(/^https?\:\/\/([^\/?#]+)(?:[\/?#]|$)/i);
  // extract hostname (will be null if no match is found)
  return matches && matches[1];
};

loginSFDC = (user, pass) => {
  SFDCConnection = new sf.Connection({
    // you can change loginUrl to connect to sandbox or prerelease env.
    //loginUrl: 'https://na61.salesforce.com'
    loginUrl: "https://cs18.salesforce.com"
  });
  return SFDCConnection.login(user, pass);
};

logoutSFDC = () => {
  SFDCConnection.logout(function(err) {
    if (err) {
      return console.error(err);
    }
    // now the session has been expired.
  });
};

checkCloudOrg = async orgId => {
  var data = {};
  data.orgId = "";
  data.accId = "";
  data.oppId = "";
  //data.prodId = "";
  console.log("Getting Cloud Org Object");
  await SFDCConnection.query(
    `SELECT ID, Cloud_Organization_ID__c, Account__r.Id, Opportunity__r.Id  FROM Coveo_Cloud_License__c where Cloud_Organization_ID__c ='${orgId}'`,
    function(err, result) {
      if (err) {
        console.error(err);
        data.orgId = "";
      }
      if (result.records.length == 1) {
        console.log(result);
        console.log("Cloud Org Record exists, id=" + result.records[0]["Id"]);
        data.orgId = result.records[0]["Id"];
        data.accId = "";
        data.oppId = "";
        if (result.records[0]["Account__r"] != null) {
          console.log(
            "Cloud Org Record exists, accid=" +
              result.records[0]["Account__r"]["Id"]
          );
          data.accId = result.records[0]["Account__r"]["Id"];
        }
        if (result.records[0]["Opportunity__r"] != null) {
          console.log(
            "Cloud Org Record exists, oppid=" +
              result.records[0]["Opportunity__r"]["Id"]
          );
          data.oppId = result.records[0]["Opportunity__r"]["Id"];
        }
      } else {
        console.log("Cloud Org DOES NOT EXISTS");
      }
    }
  );
  return data;
};

checkCustomerProject = async orgId => {
  var cp_id = "";
  await SFDCConnection.query(
    `SELECT ID, Coveo_Cloud_Organization_ID__c FROM Project_Non_Billable__c where Coveo_Cloud_Organization_ID__c ='${orgId}'`,
    function(err, result) {
      if (err) {
        console.error(err);
        cp_id = "";
      }
      if (result.records.length == 1) {
        console.log(result);
        console.log("Customer Project exists, id=" + result.records[0]["Id"]);
        cp_id = result.records[0]["Id"];
      } else {
        console.log(
          "Customer project does not exists, looking for Cloud Org object..."
        );
        cp_id = "";
      }
    }
  );
  return cp_id;
};

getAttach = async () => {
  

  await SFDCConnection.describe("ContentVersion", function(err, meta) {
    if (err) { return console.error(err); }
    console.log('Label : ' + meta.label);
    console.log('Num of Fields : ' + meta.fields.length);
    console
    for (field of meta.fields){
      console.log(field.name+" Create: "+field.createable+" Update: "+field.updateable);
    }
    // ...
  });

}

deleteAttachment = async data => {
  var cp_id = "";
  console.log('Start checking delete');
  await SFDCConnection.query(
    `SELECT ContentDocumentId FROM ContentVersion where Title ='${data.name}'`,
    function(err, result) {
      if (err) {
        console.error(err);
        cp_id = "";
      }
      if (result.records.length >= 1) {
        //console.log(result);
        console.log("Attachment exists, id=" + result.records[0]["ContentDocumentId"]);
        cp_id = result.records[0]["ContentDocumentId"];
        
      } else {
        console.log(
          "No Attachment yet"
        );
        cp_id = "";
      }
    }
  );
  if (cp_id!=""){
    /*await SFDCConnection.query(
      `DELETE [ Select Id FROM ContentVersion where Title ='${data.name}']`,
      function(err, result) {
        if (err) {
          console.error(err);
          cp_id = "";
        }
        if (result.records.length == 1) {
          //console.log(result);
          console.log("Attachment exists, id=" + result.records[0]["Id"]);
          cp_id = result.records[0]["Id"];
          
        } else {
          console.log(
            "No Attachment yet"
          );
          cp_id = "";
        }
      }
    );*/
    await SFDCConnection.sobject('ContentDocument').del([cp_id] ,
      function(err, rets) {
        if (err) { return console.error(err); }
        for (var i=0; i < rets.length; i++) {
          if (rets[i].success) {
            console.log("Deleted Successfully : " + rets[i].id);
          }
        }
      });
  }
  console.log('Done checking delete');
  return cp_id;
}

createAttachment = async data => {
  let id='';
  await SFDCConnection.sobject("ContentVersion").create(
    [
      {
        //This is the 
        FirstPublishLocationId : 'a6M0d000000D6gz',
        Title : data.name,
        PathOnClient : '/'+data.file,
        VersionData : getImage64(data.file)
      }
    ],
    function(err, rets) {
      if (err) {
        return console.error(err);
      }
      for (var i = 0; i < rets.length; i++) {
        if (rets[i].success) {
          console.log(rets[i]);
          console.log("Created record id : " + rets[i].id);
          id=rets[i].id;
        }
      }
    }
    );
    return id;
  };

  
updateAttachment = async data => {
  console.log("Update Attach1");
  await SFDCConnection.sobject("ContentVersion").update(
    [
      {
        Id: '06811000001EIzfAAG',
        Title : "TestMeWim2",
        VersionNumber: '1.2',
        VersionData : getImage64(data.file)
      }
    ],
    function(err, rets) {
      console.log("Update Attach2");
      if (err) {
        return console.error(err);
      }
      for (var i = 0; i < rets.length; i++) {
        if (rets[i].success) {
          console.log(rets[i]);
          console.log("Updated record id : " + rets[i].id);
        }
      }
    }
    );
  };
createCustomerProject = async data => {
  var date = new Date();
  const SFDCRecType = "0120d0000001GrS";
  const SitecoreRecType = "0120d0000001GrT";
  const DynamicsRecType = "0120d0000005Ptp";
  const PlatformRecType = "0120d0000009ghC";
  var recType = PlatformRecType;
  if (data.productEdition.includes("SITECORE")) {
    recType = SitecoreRecType;
  }
  if (data.productEdition.includes("SALESFORCE")) {
    recType = SFDCRecType;
  }
  if (data.productEdition.includes("DYNAMICS")) {
    recType = DynamicsRecType;
  }
  await SFDCConnection.sobject("Project_Non_Billable__c").create(
    [
      {
        Name: data.name,
        //  Coveo_Cloud_Organization_ID__c: 'akqademotaeqdoul',
        Coveo_Cloud_Organization__c: data.orgId,
        Parent_Account__c: data.accId,
        Opportunity__c: data.oppId,
        Intervention_Required__c: !(data.status == "OK"),
        Deployed_Regions__c:
          typeof data.regions === "undefined" ? "" : data.regions.join("\n"),
        Org_Checker_Date__c: date.toISOString().split("T")[0],
        Index_Size__c: data.docsfromsources,
        Accessible_Search_URL__c: data.SFDCSearchUrl,
        Available_Memory__c: data.infra_mem_free,
        Available_Disk_Space__c: data.infra_disk_free,
        Bad_Web_Sources__c: data.sourceWebWarning,
        Total_Number_of_Sources__c: data.nrofsources,
        Sources_without_Schedules__c: data.nrofnoschedulessources != 0,
        Used_Connectors__c: data.types.join("\n"),
        Using_Push_API__c: data.containspush,
        Using_Crawling_Module__c: data.containsonprem,
        Security_Providers_Without_Schedules__c:
          data.noscheduledsecprov.length != 0,
        Total_Extensions_with_Errors__c: data.nrerrorextensions,
        Total_Disabled_Extensions__c: data.nrofdisabledextensions,
        Total_Slow_Extensions__c: data.nrslowextensions,
        Total_Extensions_that_Timeout__c: data.nrtimeoutextensions,
        Total_Query_Pipelines__c: data.nrofpipelines,
        Used_Query_Pipelines__c: data.usedPipelines.join("\n"),
        ML_Version__c: data.models_platformVersion,
        ML_QS_Enabled__c: data.mlquerysuggest,
        ML_ART_Enabled__c: data.mlart,
        ML_Recommendations_Enabled__c: data.mlrecommendation,
        ML_DNE_Enabled__c: data.mldne,
        Number_of_Thesaurus_Entries__c: data.nrofthesaurus,
        Number_of_Ranking_Expressions__c: data.nrofqre,
        Number_of_Featured_Results__c: data.nroffeatured,
        Analytics_Triggered__c: data.det_analyticsSent,
        Empty_Hubs__c: data.EmptyHubs,
        Using_Search_as_You_Type__c: data.UsingSearchAsYouType,
        Average_Response_Time__c: data.AvgResponse,
        Unique_Visits__c: data.UniqueVisit,
        Total_Searches__c: data.PerformSearch,
        Total_Searches_with_Clicks__c: data.SearchWithClick,
        Click_Through__c: data.ClickThroughRatio,
        Click_Rank__c: data.AverageClickRank,
        Percentage_Using_Facets__c: data.ControlFacet,
        Percentage_Using_Different_Interfaces__c: data.ControlInterface,
        Percentage_Using_Query_Suggest__c: data.ControlQuerySuggest,
        Percentage_Using_Field_Query_Suggest__c: data.ControlFieldQS,
        Percentage_Using_Sorting__c: data.ControlSort,
        HTML_Report_Location__c: data.reportLoc,
        Required_Fixes__c: data.statusDetails
          .replace(/<i>/g, "")
          .replace(/<\/i>/g, ""),
        JSUI_Version__c: data.uiVersion,
        RecordTypeId: recType
        //https://na61.salesforce.com/setup/ui/recordtypefields.jsp?id=&type=&setupid=CustomObjects&
      }
    ],
    function(err, rets) {
      if (err) {
        return console.error(err);
      }
      for (var i = 0; i < rets.length; i++) {
        if (rets[i].success) {
          console.log("Created record id : " + rets[i].id);
        }
      }
      // ...
    }
  );
};

updateCustomerProject = async data => {
  var date = new Date();
  await SFDCConnection.sobject("Project_Non_Billable__c").update(
    [
      {
        Id: data.cp_id,
        Intervention_Required__c: !(data.status == "OK"),
        Deployed_Regions__c:
          typeof data.regions === "undefined" ? "" : data.regions.join("\n"),
        Org_Checker_Date__c: date.toISOString().split("T")[0],
        Index_Size__c: data.docsfromsources,
        Accessible_Search_URL__c: data.SFDCSearchUrl,
        Available_Memory__c: data.infra_mem_free,
        Available_Disk_Space__c: data.infra_disk_free,
        Bad_Web_Sources__c: data.sourceWebWarning,
        Total_Number_of_Sources__c: data.nrofsources,
        Sources_without_Schedules__c: data.nrofnoschedulessources != 0,
        Used_Connectors__c: data.types.join("\n"),
        Using_Push_API__c: data.containspush,
        Using_Crawling_Module__c: data.containsonprem,
        Security_Providers_Without_Schedules__c:
          data.noscheduledsecprov.length != 0,
        Total_Extensions_with_Errors__c: data.nrerrorextensions,
        Total_Disabled_Extensions__c: data.nrofdisabledextensions,
        Total_Slow_Extensions__c: data.nrslowextensions,
        Total_Extensions_that_Timeout__c: data.nrtimeoutextensions,
        Total_Query_Pipelines__c: data.nrofpipelines,
        Used_Query_Pipelines__c: data.usedPipelines.join("\n"),
        ML_Version__c: data.models_platformVersion,
        ML_QS_Enabled__c: data.mlquerysuggest,
        ML_ART_Enabled__c: data.mlart,
        ML_Recommendations_Enabled__c: data.mlrecommendation,
        ML_DNE_Enabled__c: data.mldne,
        Number_of_Thesaurus_Entries__c: data.nrofthesaurus,
        Number_of_Ranking_Expressions__c: data.nrofqre,
        Number_of_Featured_Results__c: data.nroffeatured,
        Analytics_Triggered__c: data.det_analyticsSent,
        Empty_Hubs__c: data.EmptyHubs,
        Using_Search_as_You_Type__c: data.UsingSearchAsYouType,
        Average_Response_Time__c: data.AvgResponse,
        Unique_Visits__c: data.UniqueVisit,
        Total_Searches__c: data.PerformSearch,
        Total_Searches_with_Clicks__c: data.SearchWithClick,
        Click_Through__c: data.ClickThroughRatio,
        Click_Rank__c: data.AverageClickRank,
        Percentage_Using_Facets__c: data.ControlFacet,
        Percentage_Using_Different_Interfaces__c: data.ControlInterface,
        Percentage_Using_Query_Suggest__c: data.ControlQuerySuggest,
        Percentage_Using_Field_Query_Suggest__c: data.ControlFieldQS,
        Percentage_Using_Sorting__c: data.ControlSort,
        HTML_Report_Location__c: data.reportLoc,
        Required_Fixes__c: data.statusDetails
          .replace(/<i>/g, "")
          .replace(/<\/i>/g, ""),
        JSUI_Version__c: data.uiVersion

        //https://na61.salesforce.com/setup/ui/recordtypefields.jsp?id=&type=&setupid=CustomObjects&
      }
    ],
    function(err, rets) {
      if (err) {
        return console.error(err);
      }
      for (var i = 0; i < rets.length; i++) {
        if (rets[i].success) {
          console.log("Updated record id : " + rets[i].id);
        }
      }
      // ...
    }
  );
};

(async () => {
  /*var hashA = 0;
  var hashB = 0;
  await myimageHash('results/aarpnonproductionw5otc63p_4.png').then(function (data) {
    hashA = data;

  });
  await myimageHash('results/aarpnonproductionw5otc63p_5.png').then(function (data) {
    hashB = data;

  });;
  //var hammingAB = pHash.hammingDistance(hashA, hashB);
  console.log("Hamming Distance A -> B: " + hashA);
  console.log("Hamming Distance A -> B: " + hashB);
  console.log(hammingDistance(hashA, hashB));
*/
  let settings = require("../secrets/settings.json");
  var conn = await loginSFDC(settings.SFDC_Usert, settings.SFDC_Passt).then(
    function(data) {
      //if (err) { console.log("Error:");console.error(err); return err; }
      // logged in user property
      console.log("User ID: " + data.id);
      console.log("Org ID: " + data.organizationId);
    }
  );
  console.log("Return from SFDC:");
  //console.log(SFDCConnection);
  console.log(SFDCConnection.accessToken);
  console.log(SFDCConnection.instanceUrl);
  await getAttach();
  mydata = {};
  mydata.file = 'results/vmwaregssservicecloud7kngelu5.html';
  mydata.name = 'vmwaregssservicecloud7kngelu5.html';
  await deleteAttachment(mydata);
  let atid=await createAttachment(mydata);
  //await updateAttachment('');
  await logoutSFDC();
  //conn.login(settings.SFDC_User, settings.SFDC_Pass, function (err, userInfo) {
  /* if (err) { return console.error(err); }
    // Now you can get the access token and instance URL information.
    // Save them to establish connection next time.
    console.log(conn.accessToken);
    console.log(conn.instanceUrl);
    // logged in user property
    console.log("User ID: " + userInfo.id);
    console.log("Org ID: " + userInfo.organizationId);*/
  //var cp_id;
 // var html = fs.readFileSync("results/test.html", "utf-8");
  /*const org_id = "g4strialkm97f34c";
  const cp_id = await checkCustomerProject(org_id);
  console.log("Customer Project ID");
  console.log(cp_id);

  if (cp_id == "") {
    //We have no Customer Project, check if Cloud Org Exists
    const orgData = await checkCloudOrg(org_id);
    if (orgData.orgId == "") {
      //We have no cloud org
      console.log("NO CLOUD ORG, STOP");
    } else {
      //Continue adding new customer Project
      console.log("CLOUD ORG, ADD CUSTOMER PROJECT");
      //orgData.
      orgData.status == "NOT OK";
      orgData.regions = [];
      orgData.regions.push("A");
      orgData.regions.push("B");
      orgData.docsfromsources = 1;
      orgData.SFDCSearchUrl = "https://wim";
      orgData.infra_mem_free = 10;
      orgData.infra_disk_free = 12;
      orgData.sourceWebWarning = false;
      orgData.nrofsources = 13;
      orgData.nrofnoschedulessources = [];
      orgData.nrofnoschedulessources.push("All");
      orgData.types = [];
      orgData.types.push("Salesforce");
      orgData.types.push("Sitecore");
      orgData.containspush = true;
      orgData.containsonprem = false;
      orgData.noscheduledsecprov = [];
      orgData.noscheduledsecprov.push("Me");
      orgData.nrerrorextensions = 14;
      orgData.nrofdisabledextensions = 15;
      orgData.nrslowextensions = 16;
      orgData.nrtimeoutextensions = 17;
      orgData.nrofpipelines = 18;
      orgData.usedPipelines = [];
      orgData.usedPipelines.push("Me");
      orgData.usedPipelines.push("Me2");
      orgData.models_platformVersion = 2;
      orgData.mlquerysuggest = true;
      orgData.mlart = true;
      (orgData.mlrecommendation = true), (orgData.mldne = false);
      orgData.nrofthesaurus = 10;
      orgData.nrofqre = 11;
      orgData.nroffeatured = 12;
      orgData.det_analyticsSent = true;
      orgData.EmptyHubs = true;
      orgData.UsingSearchAsYouType = true;
      orgData.AvgResponse = 100;
      orgData.UniqueVisit = 200;
      orgData.PerformSearch = 300;
      orgData.SearchWithClick = 400;
      orgData.ClickThroughRatio = 35.5;
      orgData.AverageClickRank = 36.7;
      orgData.ControlFacet = 15.2;
      orgData.ControlInterface = 15.3;
      orgData.ControlQuerySuggest = 15.4;
      orgData.ControlFieldQS = 15.5;
      orgData.ControlSort = 15.7;
      orgData.reportLoc = "https://s3.coveo.com";
      orgData.statusDetails = html;
      orgData.uiVersion = "1.1.wim";
      orgData.productEdition = "SALESFORCE_PRO";
      await createCustomerProject(orgData);
    }
  } else {
    //We do have customer Project, lets update it
    console.log("UPDATE CUSTOMER PROJECT");
    let orgData = {};
    orgData.cp_id = cp_id;
    orgData.status = "Intervention Required";
    orgData.regions = [];
    orgData.regions.push("A");
    orgData.regions.push("B");
    orgData.docsfromsources = 1;
    orgData.SFDCSearchUrl = "https://wim";
    orgData.infra_mem_free = 10;
    orgData.infra_disk_free = 12;
    orgData.sourceWebWarning = false;
    orgData.nrofsources = 13;
    orgData.nrofnoschedulessources = [];
    orgData.nrofnoschedulessources.push("All");
    orgData.types = [];
    orgData.types.push("Salesforce");
    orgData.types.push("Sitecore");
    orgData.containspush = true;
    orgData.containsonprem = false;
    orgData.noscheduledsecprov = [];
    orgData.noscheduledsecprov.push("Me");
    orgData.nrerrorextensions = 14;
    orgData.nrofdisabledextensions = 15;
    orgData.nrslowextensions = 16;
    orgData.nrtimeoutextensions = 17;
    orgData.nrofpipelines = 18;
    orgData.usedPipelines = [];
    orgData.usedPipelines.push("Me");
    orgData.usedPipelines.push("Me2");
    orgData.models_platformVersion = 2;
    orgData.mlquerysuggest = true;
    orgData.mlart = true;
    (orgData.mlrecommendation = true), (orgData.mldne = false);
    orgData.nrofthesaurus = 10;
    orgData.nrofqre = 11;
    orgData.nroffeatured = 12;
    orgData.det_analyticsSent = true;
    orgData.EmptyHubs = true;
    orgData.UsingSearchAsYouType = true;
    orgData.AvgResponse = 100;
    orgData.UniqueVisit = 200;
    orgData.PerformSearch = 300;
    orgData.SearchWithClick = 400;
    orgData.ClickThroughRatio = 35.5;
    orgData.AverageClickRank = 36.7;
    orgData.ControlFacet = 15.2;
    orgData.ControlInterface = 15.3;
    orgData.ControlQuerySuggest = 15.4;
    orgData.ControlFieldQS = 15.5;
    orgData.ControlSort = 15.7;
    orgData.reportLoc = "https://s4.coveo.com";
    orgData.statusDetails = html;
    orgData.uiVersion = "1.2.wim";
    orgData.productEdition = "SITECORE_PRO";
    await updateCustomerProject(orgData);
  }

  await logoutSFDC();*/
  //Test with NO Cloud Org Id found: STOP
  /*conn.query(
    "SELECT ID, Coveo_Cloud_Organization_ID__c FROM Project_Non_Billable__c where Coveo_Cloud_Organization_ID__c ='akqademotaeqdoul'",
    function(err, result) {
      // conn.query("SELECT ID, Coveo_Cloud_Organization_ID__c,Details__c FROM Project_Non_Billable__c where Id ='a6M0d0000000J5I'", function (err, result) {
      if (err) {
        return console.error(err);
      }
      if (result.records.length == 1) {
        console.log(result);
        console.log("Customer Project exists, id=" + result.records[0]["Id"]);
        //  console.log("Details Length: " + result.records[0]['Details__c'].length);
        cp_id = result.records[0]["Id"];
      } else {
        console.log(
          "Customer project does not exists, looking for Cloud Org object..."
        );
        cp_id = "";
      }
      /*console.log("total : " + result.totalSize);
      console.log("fetched : " + result.records.length);
      console.log("done ? : " + result.done);
      if (!result.done) {
        // you can use the locator to fetch next records set.
        // Connection#queryMore()
        console.log("next records URL : " + result.nextRecordsUrl);
      }*/
  /*   if (cp_id == "") {
        console.log("Getting Cloud Org Object");
        conn.query(
          "SELECT ID, Cloud_Organization_ID__c, Account__r.Id, Opportunity__r.Id  FROM Coveo_Cloud_License__c where Cloud_Organization_ID__c ='akqademotaeqdoul'",
          function(err, result) {
            if (err) {
              return console.error(err);
            }
            if (result.records.length == 1) {
              console.log(result);
              console.log(
                "Cloud Org Record exists, id=" + result.records[0]["Id"]
              );
              var cloudorg_id = result.records[0]["Id"];
              var acc_id = "";
              var opp_id = "";
              //var html = '<html><body>Hi this is a test</body></html>';
              if (result.records[0]["Account__r"] != null) {
                console.log(
                  "Cloud Org Record exists, accid=" +
                    result.records[0]["Account__r"]["Id"]
                );
                acc_id = result.records[0]["Account__r"]["Id"];
              }
              if (result.records[0]["Opportunity__r"] != null) {
                console.log(
                  "Cloud Org Record exists, oppid=" +
                    result.records[0]["Opportunity__r"]["Id"]
                );
                opp_id = result.records[0]["Opportunity__r"]["Id"];
              }
              console.log("Continue to creating Customer Project");
              //Create customer project
              conn.sobject("Project_Non_Billable__c").create(
                [
                  {
                    Name: "TestWim",
                    //  Coveo_Cloud_Organization_ID__c: 'akqademotaeqdoul',
                    Coveo_Cloud_Organization__c: cloudorg_id,
                    Parent_Account__c: acc_id,
                    Opportunity__c: opp_id,
                    Details__c: html,
                    RecordTypeId: "0120d0000001GrS"
                    //https://na61.salesforce.com/setup/ui/recordtypefields.jsp?id=&type=&setupid=CustomObjects&
                  }
                ],
                function(err, rets) {
                  if (err) {
                    return console.error(err);
                  }
                  for (var i = 0; i < rets.length; i++) {
                    if (rets[i].success) {
                      console.log("Created record id : " + rets[i].id);
                    }
                  }
                  // ...
                }
              );
            } else {
              console.log("Cloud Org not found, stopping");
              cp_id = "";
            }
          }
        );
      } else {
        //Update the Customer Project Implementation
        console.log("Updating Customer project with id=" + cp_id);
      }
    }
  );

  //});
*/
  const browser = await puppeteer.launch({headless: false});
  const page = await browser.newPage();
  const adminpage = await browser.newPage();

  await adminpage.goto('https://platform.cloud.coveo.com/admin', {
    
    waitUntil: "networkidle0",
    timeout: 0
  });
  //await page.setViewport({ width: 1280, height: 800 })
  //await page.goto('https://myawesomesystem/loginFrm01')
  const navigationPromise = adminpage.waitForNavigation()

  // Clicks on the login button    
  const googleLoginButtonSelector = '#loginWithGoogle'
  await adminpage.waitForSelector( googleLoginButtonSelector )
  await adminpage.click( googleLoginButtonSelector )

  // wait for the google oauth page to open
  const googleOAuthTarget = await browser.waitForTarget( target => {
    // console.log( target.url() ); // debugging
    return target.url().indexOf('https://accounts.google.com/signin/oauth/identifier') !== -1
  })

  const googleOAuthPage = await googleOAuthTarget.page()

  await googleOAuthPage.waitForSelector('#identifierId')
  await googleOAuthPage.type('#identifierId', "wnijmeijer@coveo.com", { delay: 5 } )
  await googleOAuthPage.click('#identifierNext')

  await googleOAuthPage.waitForSelector('input[type="password"]', { visible: true })
  await googleOAuthPage.type('input[type="password"]', "*Mass019" )

  await googleOAuthPage.waitForSelector('#passwordNext', { visible: true })
  await googleOAuthPage.click('#passwordNext')

  await navigationPromise
  await adminpage.waitForSelector('.member');
  //var access='';
  const access = await adminpage.evaluate( function(){
    //access = window.admin.currentAccessToken;
    return window.admin.currentAccessToken;
    //console.log(access);
  });
  //const [ returnedCookie ] = await adminpage.cookies('https://platform.cloud.coveo.com/admin/');
  //console.log("cookies:");
  //console.log(returnedCookie);
  console.log(access);

  page.on("error", msg => {
    throw msg;
  });
  await page.setViewport({
    width: 1920,
    height: 1080,
    deviceScaleFactor: 1
  });
  try {
    let mainUrlStatus = "";
    /*await page.setRequestInterception(true);
    page.on("request", request => {
      const url = request.url();
      console.log("request url:", url);
      request.continue();
    });
    page.on("requestfailed", request => {
      const url = request.url();
      console.log("request failed url:", url);
    });
    page.on("response", response => {
      //const request = response.request();
      //const murl = request.url();
      const status = response.status();
      console.log("response url:", url, "status:", status);
      //if (murl === url) {
      if (mainUrlStatus==''){
        mainUrlStatus = status;
      }
    });*/
    page.on("dialog", dialog => {
      console.log("dialog");
      dialog.accept();
    });
    await page.goto(url, {
      waitUntil: "networkidle0",
      timeout: 0
    });
    //const response = await page.goto(url);
    const pageurl = getHost(page.url());
    console.log(pageurl);
    console.log(getHost(url));
    if (getHost(url).includes(pageurl)) {
      console.log("ALL OK, move on");
    } else {
      console.log("REDIRECTED STOP IT");
    }
    //console.log("status for main url:", mainUrlStatus);
    /*const chain = response.request().redirectChain();
    console.log(chain.length); // 1
    */
    //console.log(chain[0].redi);
    //let hasSearch = (await page.$x('//div[@data-enable-search-as-you-type="true"]').length == 1);
    //console.log(hasSearch);
    let data = await page.evaluate(() => {
      //let title = document.querySelectorAll('[class^="Coveo"]').length;
      let data = {};
      data.title = "";
      try {
        data.title = Coveo.version.lib;
        /*var endpointversion = Coveo.SearchEndpoint.endpoints.default.options.version;
        Coveo.Rest.SearchEndpoint.endpoints['default'].options
        Coveo.SearchEndpoint.endpoints['default'].options*/
        data.searchAsType = false;
        data.errors = "";
        //data.hasSearchAsYoutype = hasSearch;//($x('//div[@data-enable-search-as-you-type="true"]').length == 1);
        var boxes = Coveo.$(".CoveoSearchbox");
        var asyou = Coveo.$(".CoveoSearchbox")[0].getAttribute(
          "data-enable-search-as-you-type"
        );
        data.asyou = asyou;
        //data.boxes = boxes;
        var counter = 0;
        boxes.map(box => {
          data.errors = data.errors + "Here";
          if (
            Coveo.$(".CoveoSearchbox")[counter].getAttribute(
              "data-enable-search-as-you-type"
            ) == "true"
          ) {
            data.searchAsType = true;
            data.errors = data.errors + "Here2";
          }
          counter++;
        });
      } catch (ex) {
        data.error = ex.message;
      }
      return data;
    });
    console.log("Data:");
    console.log(data);
    await page.screenshot({ path: "results/test.png" });
    /*await sharp("results/test.png")
      .resize({ height: 100 })
      .toFile("results/test2.png");*/
    console.log("Image size:" + getImage64("results/test2.png").length);
    if (data > 3) {
      await page.screenshot({ path: "results/test.png" });
    } else {
      console.log("Not a Coveo page");
    }
  } catch (e) {
    console.log(e);
    console.log("ERROR Not a Coveo page");
  }

  await browser.close();
})();
