var buttons = require('sdk/ui/button/action');
var tabs = require("sdk/tabs");
var Request = require("sdk/request").Request;
var selfSDK = require("sdk/self");
var pageModSDK = require("sdk/page-mod");
var iofile = require("sdk/io/file");
var timer = require('sdk/timers');

var {env} = require('sdk/system/environment');
const {components} = require("chrome");
const {Cc,Ci,Cu} = require("chrome");
var hashAddress = "https://hashlookup.metascan-online.com/v2/hash/";
var scanAddress = "https://scan.metascan-online.com/v2/file";
var resultAddress = "https://www.metascan-online.com/en/scanresult/file/";

var apikey = require("sdk/simple-prefs").prefs.MScanOnlineAPIKey;

Cu.import("resource://gre/modules/FileUtils.jsm");
Cu.import("resource://gre/modules/NetUtil.jsm");
require("sdk/simple-prefs").on("", onPrefChange);
if(apikey !== ""){
	checkApiKey	(apikey);
}else{
	popup('Alert','Please input your API key in option');
}
function onPrefChange(prefName) {
	apikey = require("sdk/simple-prefs").prefs.MScanOnlineAPIKey; 
	checkApiKey	(apikey);
}
 var button = buttons.ActionButton({
  id: "mozilla-link",
  label: "Visit Mozilla",
  icon: {
    "16": "./icon-16.png",
    "32": "./icon-32.png",
    "64": "./icon-64.png"
  },
  onClick: handleClick
});

function handleClick(state) {
	popup('aaaaa','bbbbb');
	// tabs.open("http://www.rarlab.com/download.htm");
}
var contextMenu = require("sdk/context-menu");
 var menuItem = contextMenu.Item({
  label: "Scan file with Metascan",
  context: require("sdk/context-menu").SelectorContext("a[href]"),
  contentScript: 'self.on("click", function (node) {' +
                 '  var text = node.href;' +
                 '  self.postMessage(text);' +
                 '});',	
  onMessage: function (url) {
	if(apikey !== ""){
		DownloadFile(url);
	}else{
		popup('Alert','Please input your API key in option');
	}
  }
});

function processDownload(fileName,filePath){
	console.log("download complete");
	var fh = iofile.open(filePath, 'rb');	
	var content = fh.read();
	var hashValue = getSha1(content);	
	fh.close();
	checkHash(hashValue,content,fileName,filePath);
}
function DownloadFile(downloadURL)
{	
	var fileName = downloadURL.substring(downloadURL.lastIndexOf('/') + 1);
	fileName = fileName.match(/([^?]*)/)[1];	
	var url_name_f = "c:\\" + Math.floor((Math.random() * 10000) + 1) + fileName;
    var chrome = require("chrome");	
    var oIOService = chrome.Cc["@mozilla.org/network/io-service;1"].getService(chrome.Ci.nsIIOService)
    var oLocalFile = chrome.Cc["@mozilla.org/file/local;1"].createInstance(chrome.Ci.nsILocalFile);
	var oDownloader = chrome.Cc["@mozilla.org/network/downloader;1"].createInstance();
	var oHttpChannel = oIOService.newChannel(downloadURL, "", null);
    oLocalFile.initWithPath(url_name_f);	
    var oDownloadObserver = {
		onDownloadComplete: function(nsIDownloader, nsresult, oFile) {
			processDownload(fileName,url_name_f);
		}
	};    
    oDownloader.QueryInterface(chrome.Ci.nsIDownloader);
    oDownloader.init(oDownloadObserver, oLocalFile);    
    oHttpChannel.QueryInterface(chrome.Ci.nsIHttpChannel);
    oHttpChannel.asyncOpen(oDownloader, oLocalFile);    

}

function checkHash(hash,fileContent,fileName,filePath){
	Request({
		url : hashAddress + hash,
		headers : {
			apikey : apikey
		},
		onComplete : function (response) {
			if(response.status === 200){
				scanDetails = response.json;			
				if(scanDetails.data_id !== undefined && scanDetails.data_id !==""){
					console.log('old file');
					iofile.remove(filePath);
					tabs.open(resultAddress + scanDetails.data_id);
				}else{
					console.log('new file');
					sendFile(fileName,fileContent,filePath);
				}
			} else{
				if(response.status === 401){
					apikey = '';
					popup("Notice","Wrong APIkey");
				}else{
					popup("Notice","You have reach the scan litmit. Try again later");
				}
			}
			
		},
	}).get();
}

function sendFile(fileName,fileContent,filePath){
	Request({
		url: scanAddress,
		content: fileContent,
		headers : {
			apikey : apikey,
			filename: fileName
		},
		onComplete: function (response) {
			iofile.remove(filePath);
			if(response.status === 200){
				var value = response.json;
				getResult(value.rest_ip,value.data_id);
			} else{
				if(response.status === 401){
					popup("Notice","Wrong APIkey");
				}else{
					popup("Notice","You have reach the scan litmit. Try again later");
				}
			}
			
		}
    }).post();
}

function getResult(restIp,data_id){
	var requestUrl = "";
	if (restIp !== undefined) {
		requestUrl = "https://" + restIp + "/file/";        
    } else {
		requestUrl = scanAddress;        
    }
	console.log('test');
	Request({
		url : requestUrl + data_id,
		headers : {
			apikey : apikey
		},
		onComplete : function (response) {			
			if(response.status === 200){
				scanDetails = response.json;			
				if(scanDetails.scan_results.progress_percentage === 100){
					tabs.open(resultAddress + data_id);
				}else{
					timer.setTimeout(function(){
						getResult(restIp,data_id);
					},1000);
				}
			} else{
				if(response.status === 401){
					popup("Notice","Wrong APIkey");
				}else{
					popup("Notice","You have reach the scan litmit. Try again later");
				}
			}
			
		},
	}).get();
}

function getSha1(fileContent){
	var file_encode_string = CryptoJS.enc.Latin1.parse(fileContent);
	var hash = CryptoJS.SHA1(file_encode_string).toString(CryptoJS.enc.Hex);
	return hash;
}

function checkApiKey(checkValue){
	Request({
		url : hashAddress + 'F7CAF62D886BDFAF1E400F039033A28A',
		headers : {
			apikey : checkValue
		},
		onComplete : function (response) {
			if(response.status === 200){
				popup("Notice","API key added successfully");
			} else{
				if(response.status === 401){
					apikey = "";
					popup("Notice","Wrong APIkey");
				}
			}			
		},
	}).get();

}
function popup(title, msg) {
	var image = null;
	var win = Cc['@mozilla.org/embedcomp/window-watcher;1'].
                      getService(Ci.nsIWindowWatcher).
                      openWindow(null, 'chrome://global/content/alerts/alert.xul',
                                  '_blank', 'chrome,titlebar=no,popup=yes', null);
	win.arguments = [image, title, msg, false, ''];
}
var CryptoJS=CryptoJS||function(e,m){var p={},j=p.lib={},l=function(){},f=j.Base={extend:function(a){l.prototype=this;var c=new l;a&&c.mixIn(a);c.hasOwnProperty("init")||(c.init=function(){c.$super.init.apply(this,arguments)});c.init.prototype=c;c.$super=this;return c},create:function(){var a=this.extend();a.init.apply(a,arguments);return a},init:function(){},mixIn:function(a){for(var c in a)a.hasOwnProperty(c)&&(this[c]=a[c]);a.hasOwnProperty("toString")&&(this.toString=a.toString)},clone:function(){return this.init.prototype.extend(this)}},
n=j.WordArray=f.extend({init:function(a,c){a=this.words=a||[];this.sigBytes=c!=m?c:4*a.length},toString:function(a){return(a||h).stringify(this)},concat:function(a){var c=this.words,q=a.words,d=this.sigBytes;a=a.sigBytes;this.clamp();if(d%4)for(var b=0;b<a;b++)c[d+b>>>2]|=(q[b>>>2]>>>24-8*(b%4)&255)<<24-8*((d+b)%4);else if(65535<q.length)for(b=0;b<a;b+=4)c[d+b>>>2]=q[b>>>2];else c.push.apply(c,q);this.sigBytes+=a;return this},clamp:function(){var a=this.words,c=this.sigBytes;a[c>>>2]&=4294967295<<
32-8*(c%4);a.length=e.ceil(c/4)},clone:function(){var a=f.clone.call(this);a.words=this.words.slice(0);return a},random:function(a){for(var c=[],b=0;b<a;b+=4)c.push(4294967296*e.random()|0);return new n.init(c,a)}}),b=p.enc={},h=b.Hex={stringify:function(a){var c=a.words;a=a.sigBytes;for(var b=[],d=0;d<a;d++){var f=c[d>>>2]>>>24-8*(d%4)&255;b.push((f>>>4).toString(16));b.push((f&15).toString(16))}return b.join("")},parse:function(a){for(var c=a.length,b=[],d=0;d<c;d+=2)b[d>>>3]|=parseInt(a.substr(d,
2),16)<<24-4*(d%8);return new n.init(b,c/2)}},g=b.Latin1={stringify:function(a){var c=a.words;a=a.sigBytes;for(var b=[],d=0;d<a;d++)b.push(String.fromCharCode(c[d>>>2]>>>24-8*(d%4)&255));return b.join("")},parse:function(a){for(var c=a.length,b=[],d=0;d<c;d++)b[d>>>2]|=(a.charCodeAt(d)&255)<<24-8*(d%4);return new n.init(b,c)}},r=b.Utf8={stringify:function(a){try{return decodeURIComponent(escape(g.stringify(a)))}catch(c){throw Error("Malformed UTF-8 data");}},parse:function(a){return g.parse(unescape(encodeURIComponent(a)))}},
k=j.BufferedBlockAlgorithm=f.extend({reset:function(){this._data=new n.init;this._nDataBytes=0},_append:function(a){"string"==typeof a&&(a=r.parse(a));this._data.concat(a);this._nDataBytes+=a.sigBytes},_process:function(a){var c=this._data,b=c.words,d=c.sigBytes,f=this.blockSize,h=d/(4*f),h=a?e.ceil(h):e.max((h|0)-this._minBufferSize,0);a=h*f;d=e.min(4*a,d);if(a){for(var g=0;g<a;g+=f)this._doProcessBlock(b,g);g=b.splice(0,a);c.sigBytes-=d}return new n.init(g,d)},clone:function(){var a=f.clone.call(this);
a._data=this._data.clone();return a},_minBufferSize:0});j.Hasher=k.extend({cfg:f.extend(),init:function(a){this.cfg=this.cfg.extend(a);this.reset()},reset:function(){k.reset.call(this);this._doReset()},update:function(a){this._append(a);this._process();return this},finalize:function(a){a&&this._append(a);return this._doFinalize()},blockSize:16,_createHelper:function(a){return function(c,b){return(new a.init(b)).finalize(c)}},_createHmacHelper:function(a){return function(b,f){return(new s.HMAC.init(a,
f)).finalize(b)}}});var s=p.algo={};return p}(Math);
(function(){var e=CryptoJS,m=e.lib,p=m.WordArray,j=m.Hasher,l=[],m=e.algo.SHA1=j.extend({_doReset:function(){this._hash=new p.init([1732584193,4023233417,2562383102,271733878,3285377520])},_doProcessBlock:function(f,n){for(var b=this._hash.words,h=b[0],g=b[1],e=b[2],k=b[3],j=b[4],a=0;80>a;a++){if(16>a)l[a]=f[n+a]|0;else{var c=l[a-3]^l[a-8]^l[a-14]^l[a-16];l[a]=c<<1|c>>>31}c=(h<<5|h>>>27)+j+l[a];c=20>a?c+((g&e|~g&k)+1518500249):40>a?c+((g^e^k)+1859775393):60>a?c+((g&e|g&k|e&k)-1894007588):c+((g^e^
k)-899497514);j=k;k=e;e=g<<30|g>>>2;g=h;h=c}b[0]=b[0]+h|0;b[1]=b[1]+g|0;b[2]=b[2]+e|0;b[3]=b[3]+k|0;b[4]=b[4]+j|0},_doFinalize:function(){var f=this._data,e=f.words,b=8*this._nDataBytes,h=8*f.sigBytes;e[h>>>5]|=128<<24-h%32;e[(h+64>>>9<<4)+14]=Math.floor(b/4294967296);e[(h+64>>>9<<4)+15]=b;f.sigBytes=4*e.length;this._process();return this._hash},clone:function(){var e=j.clone.call(this);e._hash=this._hash.clone();return e}});e.SHA1=j._createHelper(m);e.HmacSHA1=j._createHmacHelper(m)})();