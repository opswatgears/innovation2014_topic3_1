self.port.on("SetScannedIPers", function (ipers) {
	var ScannedIPers = new Array();
	for (var i = 0; i < ipers.length; i++) {		
		ScannedIPers.push(ipers[i]);
	}
	unsafeWindow.ScannedIPersInfo = cloneInto(ScannedIPers, unsafeWindow);	
});

self.port.on("SetScanDetails", function (iper) {
	unsafeWindow.iper = cloneInto(iper, unsafeWindow);	
	unsafeWindow.result = cloneInto(iper.scanDetails, unsafeWindow);	
});

window.addEventListener("ClickDetailEvent", function(event) {  
  self.port.emit("ClickDetailEvent", event.detail);
}, false);