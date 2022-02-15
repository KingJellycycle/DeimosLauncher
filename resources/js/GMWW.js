var window = self;
importScripts("./neutralino.js");
self.onmessage = async function () {
 for(var i = 10; i < 18; i++) {
   console.log("uid"+i);
   await Neutralino.storage.putData({ bucket: "uid"+i, data: "uid"+i });
 }
}