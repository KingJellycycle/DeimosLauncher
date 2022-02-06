const mainview = document.getElementsByClassName("mainview")[0];

function showInfo() {
    document.getElementById('info').innerHTML = `
        ${NL_APPID} is running on port ${NL_PORT}  inside ${NL_OS}
        <br>
        <span>server: v${NL_VERSION} . client: v${NL_CVERSION}</span>
        `;
}

function setTray() {
    if (NL_MODE != "window") {
        console.log("INFO: Tray menu is only available in the window mode.");
        return;
    }
    let tray = {
        icon: "/resources/images/icons/app/trayIcon.png",
        menuItems: [
            {
                id: "ABOUT",
                text: "About"
            }, {
                id: "SEP",
                text: "-"
            }, {
                id: "QUIT",
                text: "Quit"
            }
        ]
    };
    Neutralino.os.setTray(tray);
}

function onTrayMenuItemClicked(event) {
    switch (event.detail.id) {
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

// this doesn't work?
Neutralino.window.setDraggableRegion("draggable");

Neutralino.events.on("trayMenuItemClicked", onTrayMenuItemClicked);
Neutralino.events.on("windowClose", onWindowClose);

if (NL_OS != "Darwin") { // TODO: Fix https://github.com/neutralinojs/neutralinojs/issues/615
    setTray();
}


async function load_page(url) {
    mainview.innerHTML = await(await fetch(url)).text();
    if (url == 'pages/home.html') {
        getNews();
    }
    if (url == 'pages/bound.html') {
        getPatches();
    }
}

function open_in_new_tab(url) {
    Neutralino.os.open(url);
}

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
    for (let i = 0; i < items.length; i++) {
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
// getNews();

// Fetch json data from http://192.168.0.196/bound/patches/latest.json and display it in the mainview */
async function getPatches() {
    // Generate a random number 
    const random = Math.floor(Math.random() * 100);

    const latesturl = "http://192.168.0.196/bound/patches/latest.json?" + random;
    const latestresponse = await fetch(latesturl);
    const latestjson = await latestresponse.json();
    const patchurl = "http://192.168.0.196/bound/patches/" + latestjson.version + "/patch.json?" + random;
    //console.log(latestjson,patchurl)

    const response = await fetch(patchurl);
    const json = await response.json();
    let html = "";
    const item = json;
    const title = item.title;
    const version = item.version;
    const description = item.description;

    //console.log(item.date)
    const date = new Date(item.date).toDateString();

    note = '';
    for (let i = 0; i < item.patch_notes.length; i++) {
        note += `<div class="note">${item.patch_notes[i]}</div>`;
    }

    html += `
        <div class="patch">
            <div class="title">${title}</div>
            <div class="date">${date}</div>
            <div class="version">${version}</div>
            <div class="description">${description}</div>
            <div class="changes">Changes:</div>
            <div class="patchlist">
                ${note}
            </div>
        </div>
    `;
    document.getElementById('patch').innerHTML = html;

    for (let i = latestjson.prev_versions.length; i > 0; i--) {
        if (i == latestjson.prev_versions.length - 3) {
            break;
        }
        const prev_version = latestjson.prev_versions[i-1];
        const prev_url = "http://192.168.0.196/bound/patches/" + prev_version + "/patch.json?" + random;
        const prev_response = await fetch(prev_url);
        const prev_json = await prev_response.json();
        let prev_html = "";
        const prev_item = prev_json;
        const prev_title = prev_item.title;
        const prev_description = prev_item.description;

        const date = new Date(prev_item.date).toDateString();

        prev_html += `
            <div class="sub-patch">
                <div class="title">${prev_title}</div>
                <div class="description">${prev_description}</div>
                <div class="container">
                    <div class="version">${prev_version}</div>
                    <div class="date">${date}</div>
                </div>
            </div>
        `;

        document.getElementById('prev-patch').innerHTML += prev_html;

    }
}



// LOAD PAGE
load_page('pages/home.html');