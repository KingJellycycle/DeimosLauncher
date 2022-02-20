// Storage values!
var newsPosts = [];
var boundPatches = [];
var boundPrimaryPatch = []
var boundSubPatchesHtml = ``

var _settings = {
    "theme": "dark",
    "custom_css": "",
    
    "default_page": "home",

    "background_update": true,
    "show_desktop_notifications": true,

    "storage_dir": "./Diemos_Storage",

    "bound_dir": "./Diemos_Storage/bound",
    "bound_version": ""
}

async function exit_app() {
    let result = await pywebview.api.exit_app();
}

async function minimise_app() {
    let result = await pywebview.api.minimise_app();
}

async function set_page(page) {
    let result = await pywebview.api.set_page(page);
    //document.getElementById("mainview").scrollTop = 0;
    //document.getElementById("mainview").scroll(top);
    //console.log(result)
    document.getElementById('mainview').innerHTML = result

    if (page == "home.html") {
        if (newsPosts.length == 0) {
            await get_news()
        }
        await set_news()
    }

    if (page == "bound.html") {
        if (boundPatches.length == 0) {
            await get_patches()
        }
        await set_patches()
    }

    if (page == 'settings.html') {
        document.getElementById('theme').checked = _settings.theme == "light" ? true : false;

        document.getElementById('background_update').checked = _settings.background_update;
        document.getElementById('show_desktop_notifications').checked = _settings.show_desktop_notifications;
    }

    //document.getElementById("mainview").scrollTop = 0;
    return true
}

async function get_news() {
    await pywebview.api.get_news().then(function(response) {
        newsPosts = response
        set_news()
    }
    );
}

async function reload_data() {
    await get_news()
    await get_patches()
}

async function load_settings() {
    let result = await pywebview.api.load_settings()
    _settings = result
    //console.log(_settings)
    await apply_settings()
}

async function apply_settings() {
    document.documentElement.className = _settings.theme
}


async function set_settings() {
    // set theme
    if (document.getElementById('theme').checked) {
        _settings.theme = "light";
    } else {
        _settings.theme = "dark"
    }
    //_settings.custom_css = document.getElementById('custom_css').value;
    _settings.background_update = document.getElementById('background_update').checked;
    _settings.show_desktop_notifications = document.getElementById('show_desktop_notifications').checked;

    pywebview.api.set_settings(_settings).then(function(response) {
        generate_toast("Applying settings!"); 
        
        //console.log(_settings.theme)
        document.documentElement.className = _settings.theme
    });
}


async function get_patches() {
    pywebview.api.get_patches().then(function(response) {
        boundPatches = response
        set_patches()
    }
    );
}

async function set_news() {
    var html = ``;
    for (let i = 0; i < newsPosts.length; i++) {
        //console.log(newsPosts[i])
        const item = newsPosts[i];
        const title = item['title'];
        const link = item['link'];
        const date = new Date(item['date']).toDateString();
        const category = item['category'];
        const summary = item['summary'];

        html += `
            <div class="article">
                <a class="title" href="#" onclick="generate_page('news',${i})">${title}</a>
                <p class="description">${summary}</p>
                <div class="container">
                    <div class="date">${date} - ${category}</div>
                    <div class="type"></div>
                    <a href="#" onclick="generate_page('news',${i})" class="button">Read</a>
                </div>
            </div>
        `;
    }
    if (document.getElementById('feed')) {
        document.getElementById('feed').innerHTML = html;
    }
}

async function set_patches() {
    var latest_position = boundPatches.length - 1;
    const title = boundPatches[latest_position]['title'];
    const version = boundPatches[latest_position]['version'];
    const description = boundPatches[latest_position]['description'];
    const date = new Date(boundPatches[latest_position]['date']).toDateString();
    const note = boundPatches[latest_position]['notes'];
    
    var current_patch_html = `        
    <div class="patch">
    <div class="title">${title}</div>
    <div class="date">${date}</div>
    <div class="version">${version}</div>
    <div class="description">${description}</div>
    <div class="changes">Changes:</div>
    <div class="patchlist">
    ${note}
    </div>
    </div>`;
    
    var prev_patch_html = ``;  // Previous patch html
    for (let i = boundPatches.length-1; i > 0; i--) {
        if (i == boundPatches.length - 3) {
            break;
        }

        const patch = boundPatches[i-1];

        const title = patch['title'];
        const version = patch['version'];
        const description = patch['description'];
        const date = new Date(patch['date']).toDateString();
        //const note = patch['notes'];

        prev_patch_html += `
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

    if (document.getElementById('patch')) {
        document.getElementById('patch').innerHTML = current_patch_html;
        document.getElementById('prev-patch').innerHTML = prev_patch_html;
    }
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


async function generate_page(type, index) {
    if (type == "news") {
        const item = newsPosts[index];
        const content = item["content"];
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

        await set_page('article.html');

        document.getElementById('feed').innerHTML = doc.documentElement.innerHTML;
        document.getElementById("ArticleTitle").innerHTML = item["title"];

    }

    if (type == "patch") {
        const versionPage = boundPatches[index];
        const title = versionPage['title'];
        const version = versionPage['version'];
        const description = versionPage['description'];
        const date = new Date(versionPage['date']).toDateString();
        const note = versionPage['notes'];

        let html = "";

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

        await set_page('article.html');

        document.getElementById('feed').innerHTML = html;
        document.getElementById("ArticleTitle").innerHTML = title;

    }
}


function SmoothScroll(target, speed, smooth) {
    if (target === document)
        target = (document.scrollingElement 
              || document.documentElement 
              || document.body.parentNode 
              || document.body) // cross browser support for document scrolling
      
    var moving = false
    var pos = target.scrollTop
  var frame = target === document.body 
              && document.documentElement 
              ? document.documentElement 
              : target // safari is the new IE
  
    target.addEventListener('mousewheel', scrolled, { passive: false })
    target.addEventListener('DOMMouseScroll', scrolled, { passive: false })

    function scrolled(e) {
        e.preventDefault(); // disable default scrolling

        var delta = normalizeWheelDelta(e)

        pos += -delta * speed
        pos = Math.max(0, Math.min(pos, target.scrollHeight - frame.clientHeight)) // limit scrolling

        if (!moving) update()
    }

    function normalizeWheelDelta(e){
        if(e.detail){
            if(e.wheelDelta)
                return e.wheelDelta/e.detail/40 * (e.detail>0 ? 1 : -1) // Opera
            else
                return -e.detail/3 // Firefox
        }else
            return e.wheelDelta/120 // IE,Safari,Chrome
    }

    function update() {
        moving = true
    
        var delta = (pos - target.scrollTop) / smooth
    
        target.scrollTop += delta
    
        if (Math.abs(delta) > 0.5)
            requestFrame(update)
        else
            moving = false
    }

    var requestFrame = function() { // requestAnimationFrame cross browser
        return (
            window.requestAnimationFrame ||
            window.webkitRequestAnimationFrame ||
            window.mozRequestAnimationFrame ||
            window.oRequestAnimationFrame ||
            window.msRequestAnimationFrame ||
            function(func) {
                window.setTimeout(func, 1000 / 50);
            }
        );
    }()
}

// on dom load
window.addEventListener('pywebviewready', async function() {
    //console.log(await pywebview.api.set_page('home.html'))
    await load_settings();
    await set_page('home.html');
    generate_toast('Welcome to the PyWebView!');
    new SmoothScroll(document.getElementById("mainview"),20,12)
});