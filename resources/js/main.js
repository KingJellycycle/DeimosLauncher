const mainview = document.getElementsByClassName("mainview")[0];
window.__forceSmoothScrollPolyfill__ = true;

// Storage values!
var newsPosts = [];
var boundPatches = [];
var boundPrimaryPatch = []
var boundSubPatchesHtml = ``


var _settings = {
    // Theme Settings
    theme: "dark",
    custom_css: "",
    // Window Settings
    default_page: "home",
    

    // Background Settings
    background_update: true,
    show_desktop_notifications: true,

    // Deimos Settings
    storage_dir: "./Deimos_Storage",

    // Bound Settings
    bound_dir: "",
    bound_version: "",
}

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

Neutralino.window.setDraggableRegion("draggable");

async function check_for_settings() {

    try {
        let response = await Neutralino.filesystem.readFile(_settings.storage_dir +'/settings.json'); 
        if (response) {
            generate_toast("Settings: loaded!");
            //console.log(`${response}`);
            _settings = JSON.parse(response);
            //console.log(_settings);
        }
    } catch (err) {
        if (err.code == "NE_FS_FILRDER") {
            generate_toast("Settings: not found!");
            generate_toast("Settings: Generating new settings...");
            //console.log("Settings: not found!");
            Neutralino.filesystem.createDirectory(_settings.storage_dir);
            Neutralino.filesystem.writeFile(_settings.storage_dir +'/settings.json', JSON.stringify(_settings));
        }
        console.log(err)
    }

    apply_settings()
}

function apply_settings() {
    generate_toast("Applying settings!"); 
    //console.log(_settings.theme)
    document.documentElement.className = _settings.theme
    //document.getElementsByName('html').className = _settings.theme;
    //document.getElementById('custom_css').innerHTML = _settings.custom_css;
    //document.getElementById('background_update').innerHTML = _settings.background_update;
    //document.getElementById('show_desktop_notifications').innerHTML = _settings.show_desktop_notifications;
    //document.getElementById('bound_dir').innerHTML = _settings.bound_dir;
    //document.getElementById('bound_version').innerHTML = _settings.bound_version;
}

function save_settings() {
    //generate_toast(document.getElementById('theme').checked)
    if (document.getElementById('theme').checked) {
        _settings.theme = "light";
    } else {
        _settings.theme = "dark"
    }
    //_settings.custom_css = document.getElementById('custom_css').value;
    _settings.background_update = document.getElementById('background_update').checked;
    _settings.show_desktop_notifications = document.getElementById('show_desktop_notifications').checked;
    //_settings.bound_dir = document.getElementById('bound_dir').value;
    //_settings.bound_version = document.getElementById('bound_version').value;
    Neutralino.filesystem.writeFile(_settings.storage_dir +'/settings.json', JSON.stringify(_settings));
    apply_settings();
}

Neutralino.events.on("trayMenuItemClicked", onTrayMenuItemClicked);
Neutralino.events.on("windowClose", onWindowClose);

if (NL_OS != "Darwin") { // TODO: Fix https://github.com/neutralinojs/neutralinojs/issues/615
    setTray();
}

async function generate_page(type, index) {
    if (type == "news") {
        const item = newsPosts[index];
        const content = item.getElementsByTagName("content")[0].childNodes[0].nodeValue;
        const html = `<div class="article post">
            ${content}
        </div>`;

        let parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');

        for (i = 0; i < doc.getElementsByTagName("a").length; i ++) {
            const link = doc.getElementsByTagName("a")[i];
            link.setAttribute("onclick", "open_in_new_tab('" + link.getAttribute("href") + "')");
            link.setAttribute("href", "#");
        }

        await load_page('pages/article.html');

        document.getElementById('feed').innerHTML = doc.documentElement.innerHTML;
        document.getElementById("ArticleTitle").innerHTML = item.getElementsByTagName("title")[0].childNodes[0].nodeValue;

    }

    if (type == "patch") {
        const versionPage = boundPatches[index];
        //console.log(index, versionPage)
        const random = Math.floor(Math.random() * 100);
        const response = await fetch("http://192.168.0.196/bound/patches/" + versionPage + "/patch.json?" + random);
        const json = await response.json();
        let html = "";
        const item = json;
        const title = item.title;
        const version = item.version;
        const description = item.description;

        // console.log(item.date)
        const date = new Date(item.date).toDateString();

        note = '';
        for (let i = 0; i < item.patch_notes.length; i++) {
            note += `<div class="note">${
                item.patch_notes[i]
            }</div>`;
        }

        html += `
            <div class="patch">
                <div class="date">${date}</div>
                <div class="version">${version}</div>
                <div class="description">${description}</div>
                <div class="changes">Changes:</div>
                <div class="patchlist">
                    ${note}
                </div>
            </div>
        `;

        await load_page('pages/article.html');

        document.getElementById('feed').innerHTML = html;
        document.getElementById("ArticleTitle").innerHTML = title;

    }
}

async function load_page(url) {
    mainview.innerHTML = await(await fetch(url)).text();
    window.scrollTo({top: 0, behavior: 'smooth'});
    if (url == 'pages/home.html') {
        if (newsPosts.length === 0) {
            await updateNews();
        }
        await setNews();
    }
    if (url == 'pages/bound.html') {
        await setPatches();
    }
    if (url == 'pages/settings.html') {
        document.getElementById('theme').checked = _settings.theme == "light" ? true : false;

        document.getElementById('background_update').checked = _settings.background_update;
        document.getElementById('show_desktop_notifications').checked = _settings.show_desktop_notifications;
    }
}

async function open_in_new_tab(url) {
    Neutralino.os.open(url);
}

async function generate_toast(string) {
    var toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerHTML = string;
    document.getElementById("toast-container").appendChild(toast);
    setTimeout(function () {
        toast.classList.add('show');
    }, 10);
    setTimeout(function () {
        toast.classList.remove('show');
    }, 2000);
    setTimeout(function () {
        toast.classList.add('flat');
    }, 2500);
    setTimeout(function () {
        toast.remove();
    }, 3000);
}

async function setNews() {
    //generate_toast("Setting News!");
    html = ``;
    for (let i = 0; i < newsPosts.length; i++) {
        const item = newsPosts[i];
        const title = item.getElementsByTagName("title")[0].childNodes[0].nodeValue;
        const link = item.getElementsByTagName("link")[0].getAttribute("href");
        const description = item.getElementsByTagName("summary")[0].childNodes[0].nodeValue;
        const date = new Date(item.getElementsByTagName("published")[0].childNodes[0].nodeValue).toDateString();
        const category = item.getElementsByTagName("category")[0].getAttribute("term");
        html += `
            <div class="article">
                <a class="title" href="#" onclick="generate_page('news',${i})">${title}</a>
                <p class="description">${description}</p>
                <div class="container">
                    <div class="date">${date} - ${category}</div>
                    <div class="type"></div>
                    <a href="#" onclick="generate_page('news',${i})" class="button">Read</a>
                </div>
            </div>
        `;
    }

    document.getElementById('feed').innerHTML = html;
}

async function setPatches() {
    //generate_toast("Setting Patches!"); 
    document.getElementById('patch').innerHTML = boundPrimaryPatch;
    document.getElementById('prev-patch').innerHTML = boundSubPatchesHtml;
}

// Fetch XML feed from https://www.kingjellycycle.com/feed.xml
// and display it in the mainview
async function updateNews() {
    // Random number to force load feed
    //generate_toast("Updating News!");
    const random = Math.floor(Math.random() * 100);
    const url = "https://www.kingjellycycle.com/feed.xml?" + random;
    const response = await fetch(url);
    const xml = await response.text();
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xml, "text/xml");
    const items = xmlDoc.getElementsByTagName("entry");
    newsPosts = [];
    for (let i = 0; i < items.length; i++) {
        newsPosts.push(items[i]);
    }
};

// Fetch json data from http://192.168.0.196/bound/patches/latest.json and display it in the mainview */
async function updatePatches() {
    // Generate Toast
    //("Updating Patches!");

    // Reset Global Variables
    boundPrimaryPatch = ``;
    boundSubPatchesHtml = ``;
    boundPatches = [];

    // Generate a random number
    const random = Math.floor(Math.random() * 100);

    const latesturl = "http://192.168.0.196/bound/patches/latest.json?" + random;
    const latestresponse = await fetch(latesturl);
    const latestjson = await latestresponse.json();
    const patchurl = "http://192.168.0.196/bound/patches/" + latestjson.version + "/patch.json?" + random;
    // console.log(latestjson,patchurl)

    const response = await fetch(patchurl);
    const json = await response.json();
    const item = json;
    const title = item.title;
    const version = item.version;
    const description = item.description;

    // console.log(item.date)
    const date = new Date(item.date).toDateString();

    note = '';
    for (let i = 0; i < item.patch_notes.length; i++) {
        note += `<div class="note">${
            item.patch_notes[i]
        }</div>`;
    }


    boundPrimaryPatch += `
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


    for (let i = 0; i < latestjson.prev_versions.length; i++) {
        boundPatches.push(latestjson.prev_versions[i]);
    }

    for (let i = boundPatches.length; i > 0; i--) {
        if (i == boundPatches.length - 3) {
            break;
        }
        const random = Math.floor(Math.random() * 100);
        const version = boundPatches[i - 1];
        const url = "http://192.168.0.196/bound/patches/" + version + "/patch.json?" + random;
        const response = await fetch(url);
        const json = await response.json();
        const item = json;
        const title = item.title;
        const description = item.description;
        0
        const date = new Date(item.date).toDateString();

        boundSubPatchesHtml += `
            <a href="#" onclick="generate_page('patch', ${i - 1})" class="sub-patch">
                <div class="title">${title}</div>
                <div class="description">${description}</div>
                <div class="container">
                    <div class="version">${version}</div>
                    <div class="date">${date}</div>
                </div>
            </a>
        `;
    }
};

// Initialisation stuffs!
// GET news and patch data and store them
// seems to be a loading issues
function startup() {
    check_for_settings();

    updateNews();
    updatePatches();
    // LOAD PAGE
    load_page('pages/home.html');

}

startup();