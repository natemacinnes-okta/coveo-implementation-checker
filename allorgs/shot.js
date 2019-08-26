// npm install puppeteer
// npm i -S image-hash
const puppeteer = require('puppeteer');
var pHash = require("image-hash");
var url = 'https://midatlantic.aaa.com/search%20results?';
//url = 'https://ikb.vmware.com/';
//url = 'https://inside.qa02.corp.adobe.com/content/inside/en/search.html';
//url = 'https://search.aarp.org/gss/everywhere?q=games&intcmp=DSO-SRCH-EWHERE';
url = 'https://search.aarp.org/gss/everywhere?q=games&intcmp=DSO-SRCH-EWHERE';
url = 'https://new.aba.com/member-tools/industry-solutions';

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
}

myimageHash = file => {
  let mydata = 0;
  let promise = new Promise((resolve) => {

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
}

(async () => {
  var hashA = 0;
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

  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.setViewport({
    width: 1920,
    height: 1080,
    deviceScaleFactor: 1,
  });
  try {
    let mainUrlStatus = '';
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
    const response = await page.goto(url);
    const pageurl = page.url();
    console.log(pageurl);
    if (pageurl.includes(url)) {
      console.log('ALL OK, move on');
    } else {
      console.log("REDIRECTED STOP IT");
    }
    console.log("status for main url:", mainUrlStatus);
    const chain = response.request().redirectChain();
    console.log(chain.length); // 1
    //console.log(chain[0].redi); 
    let data = await page.evaluate(() => {
      let title = document.querySelectorAll('[class^="Coveo"]').length;
      return title;
    });
    if (data > 3) {
      await page.screenshot({ path: 'results/test.png' });
    }
    else {
      console.log('Not a Coveo page');
    }
  }
  catch (e) {
    console.log('ERROR Not a Coveo page');
  }

  await browser.close();
})();
