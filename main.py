import codecs
import webview
import urllib.request
import xml.dom.minidom
import json
import os

from gamemanager import GameManager

_server_address = "http://192.168.0.196/"
_news_address = "https://www.kingjellycycle.com/feed.xml"

class Api():

    def __init__(self):

        self.window = False
        self.mainview = False
        self._settings = {
            "theme": "dark",
            "custom_css": "",

            "default_page": "home",

            "background_update": "enabled",
            "show_desktop_notifications": "enabled",

            "storage_dir": "./Deimos_Storage",

            "bound_dir": "./Deimos_Storage/bound",
            "bound_version": ""
        }
        self.create_directories()
        self.load_settings()

        self.gm = GameManager(_server_address, self._settings["bound_dir"])

    def set_page(self, page):
        file = codecs.open("./src/pages/"+page, "r", "utf-8")
        return file.read()

    def get_news(self):
        articles = []

        fetch = urllib.request.urlopen(_news_address)
        data = fetch.read()
        fetch.close()
        
        xmlParsed = xml.dom.minidom.parseString(data)

        for item in xmlParsed.getElementsByTagName('entry'):
            #print(item.getElementsByTagName('link')[0].getAttribute('href'))
            title = item.getElementsByTagName('title')[0].childNodes[0].data
            link = item.getElementsByTagName('link')[0].getAttribute('href')
            date = item.getElementsByTagName('published')[0].childNodes[0].data
            category = item.getElementsByTagName('category')[0].getAttribute('term')
            summary = item.getElementsByTagName('summary')[0].childNodes[0].data
            content = item.getElementsByTagName('content')[0].childNodes[0].data
            
            post = {
                "title": title,
                "link": link,
                "date": date,
                "category": category,
                "summary": summary,
                "content": content
            }

            articles.append(post)
        
        return articles

    def get_patches(self):
        fetch = urllib.request.urlopen(_server_address+ "bound/patches/latest.json")
        data = fetch.read()
        fetch.close()

        dataParse = json.loads(data)

        patches = []
        for p in dataParse['prev_versions']:
            info = urllib.request.urlopen(_server_address+ "bound/patches/"+p+"/patch.json")
            infoData = info.read()
            info.close()

            infoParse = json.loads(infoData)

            notes = ""
            for note in infoParse['patch_notes']:
                notes += "<div class='note'>"+note+"</div>"


            patch = {
                "version": p,
                "title": infoParse['title'],
                "description": infoParse['description'],
                "date": infoParse['date'],
                "notes": notes
            }

            patches.append(patch)
        return patches

    def set_settings(self,settings):
        self._settings = settings

    def save_settings(self):
        # write settings to file settings.json in director storage_dir
        with open(self._settings["storage_dir"] + "/settings.json", "w") as f:
            json.dump(self._settings, f)

    def load_settings(self):
        # load settings from file settings.json in director storage_dir
        if os.path.exists(self._settings["storage_dir"] + "/settings.json"):
            with open(self._settings["storage_dir"] + "/settings.json", "r") as f:
                self._settings = json.load(f)
        else:
            self.save_settings()

        #print(self._settings)
        return self._settings
    
    def minimise_app(self):
        window.minimize()

    def exit_app(self):
        self.save_settings()
        window.destroy()

    def create_directories(self):
        if not os.path.exists(self._settings["storage_dir"]):
            os.makedirs(self._settings["storage_dir"])
        if not os.path.exists(self._settings["bound_dir"]):
            os.makedirs(self._settings["bound_dir"])
        if not os.path.exists(self._settings["storage_dir"] + "/bound"):
            os.makedirs(self._settings["storage_dir"] + "/bound")

if __name__ == '__main__':
    api = Api()
    window = webview.create_window('Deimos', './src/index.html',js_api=api, width=1024, height=600, \
                          x=None, y=None, resizable=False, fullscreen=False, \
                          min_size=(1024, 600), hidden=False, frameless=True, \
                          minimized=False, on_top=False, confirm_close=False, \
                          background_color='#111', text_select=False,easy_drag=False)

    # Set Dragable part of window and start the window
    webview.DRAG_REGION_SELECTOR = '#draggable'
    webview.start(debug=True)