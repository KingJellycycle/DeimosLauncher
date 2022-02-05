// This is just a sample app. You can structure your Neutralinojs app code as you wish.
// This example app is written with vanilla JavaScript and HTML.
// Feel free to use any frontend framework you like :)

const mainview = document.getElementsByClassName("mainview")[0];

function showInfo() {
    document.getElementById('info').innerHTML = `
        ${NL_APPID} is running on port ${NL_PORT}  inside ${NL_OS}
        <br>
        <span>server: v${NL_VERSION} . client: v${NL_CVERSION}</span>
        `;
}

function setTray() {
    if(NL_MODE != "window") {
        console.log("INFO: Tray menu is only available in the window mode.");
        return;
    }
    let tray = {
        icon: "/resources/images/icons/app/trayIcon.png",
        menuItems: [
            {id: "ABOUT", text: "About"},
            {id: "SEP", text: "-"},
            {id: "QUIT", text: "Quit"}
        ]
    };
    Neutralino.os.setTray(tray);
}

function onTrayMenuItemClicked(event) {
    switch(event.detail.id) {
        case "ABOUT":
            Neutralino.window.create('/pages/about.html', {
                icon: '/images/icons/app/appIcon.png',
                enableInspector: false,
                width: 600,
                height: 400,
                minWidth: 600,
                minHeight: 400,
                maximizable: false,
                exitProcessOnClose: true,
                processArgs: '--window-id=W_ABOUT'
            });
            break;
        case "QUIT":
            Neutralino.app.exit();
            break;
    }
}

function onWindowClose() {
    Neutralino.app.exit();
}

function onWindowMinimize() {
    Neutralino.window.minimize();
}

Neutralino.init();

Neutralino.events.on("trayMenuItemClicked", onTrayMenuItemClicked);
Neutralino.events.on("windowClose", onWindowClose);

if(NL_OS != "Darwin") { // TODO: Fix https://github.com/neutralinojs/neutralinojs/issues/615
    setTray();
}

// LOAD PAGE
load_page('pages/home.html');

// Fetch XML feed from https://www.kingjellycycle.com/feed.xml
// and display it in the mainview
async function getNews() {
    const url = "https://www.kingjellycycle.com/feed.xml";
    const response = await fetch(url);
    const xml = await response.text();
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xml, "text/xml");
    const items = xmlDoc.getElementsByTagName("entry");
    let html = "";
    for(let i = 0; i < items.length; i++) {
        const item = items[i];
        const title = item.getElementsByTagName("title")[0].childNodes[0].nodeValue;
        const link = item.getElementsByTagName("link")[0].getAttribute("href");
        const description = item.getElementsByTagName("summary")[0].childNodes[0].nodeValue;
        const date = new Date(item.getElementsByTagName("published")[0].childNodes[0].nodeValue).toDateString();
        const category = item.getElementsByTagName("category")[0].getAttribute("term");
        html += `
            <div class="article">
                <a class="title" href="#" onclick="open_in_new_tab('${link}')" target="_blank">${title}</a>
                <p class="description">${description}</p>
                <div class="container">
                    <div class="date">${date} - ${category}</div>
                    <div class="type"></div>
                    <a href="#" onclick="open_in_new_tab('${link}')" class="button">Read</a>
                </div>
            </div>
        `;
    }
    document.getElementById('feed').innerHTML = html;
}

async function load_page(url) {  
    mainview.innerHTML = await (await fetch(url)).text();
    if (url == 'pages/home.html') {
        getNews();
    }
  }


function open_in_new_tab(url) {
    Neutralino.os.open(url);
}

//getNews();


