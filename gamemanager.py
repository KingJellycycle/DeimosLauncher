import urllib.request
import json
import platform
import os
import threading
import io

class GameManager():

    def __init__(self, server_address, game_directory):
        self.server_address = server_address
        self.game_directory = game_directory

        self.latest_version, self.latest_mainline_version, self.version_list = self.get_latest_versions()
        self.local_version = self.get_local_version()

        self.download_game()

    def get_local_version(self):
        # Check if file exists
        if os.path.isfile(self.game_directory + "/version.txt"):
            with open(self.game_directory+"/version.txt", "r") as file:
                return file.read()
        else:
            return False

    def get_latest_versions(self):
        fetch = urllib.request.urlopen(self.server_address+ "bound/patches/latest.json")
        data = fetch.read()
        fetch.close()

        dataParse = json.loads(data)

        self.latest_version = dataParse['version']
        self.latest_mainline_version = dataParse['mainline_versions'][-1]
        self.version_list = dataParse['prev_versions']

        return self.latest_version, self.latest_mainline_version, self.version_list

    def compare_versions(self):
        if (self.local_version != self.latest_version):
            return True
        else:
            return False


    def download_game(self):
        def _download():
            file_name = ""
            url = ""

            if platform.system() == "Windows":
                file_name = "bound.exe"
                url = self.server_address + "bound/patches/" + self.latest_mainline_version + "/bound.exe"
            elif platform.system() == "Linux":
                file_name = "bound.x86_64"
                url = self.server_address + "bound/patches/" + self.latest_mainline_version + "/bound.x86_64"
            elif platform.system() == "Darwin":
                file_name = "bound.app"
                url = self.server_address + "bound/patches/" + self.latest_mainline_version + "/bound.app"

            with urllib.request.urlopen(url) as response:
                self._download_progress(response,url,file_name)


            with urllib.request.urlopen(self.server_address + "bound/patches/" + self.latest_mainline_version + "/bound.pck") as Response:
                self._download_progress(Response, self.server_address + "bound/patches/" + self.latest_mainline_version + "/bound.pck", "bound.pck")

            with open(self.game_directory + "/version.txt", "w") as wfile:
                wfile.write(self.latest_mainline_version)

            
        threaded_download = threading.Thread(target=_download)
        threaded_download.start()

    def patch_game(self):
        pass

    def _download_progress(self,Response,url,file_name):
        Length = Response.getheader('content-length')
        BlockSize = 1000000  # default value
        if Length:
            Length = int(Length)
            BlockSize = max(4096, Length // 20)
        print("UrlLib len, blocksize: ", Length, BlockSize)
        Size = 0
        download_file = open(self.game_directory + "/" + file_name, 'wb')
        while True:
            BufferNow = Response.read(BlockSize)
            if not BufferNow:
                break
            Size += len(BufferNow)
            download_file.write(BufferNow)
            if Length:
                Percent = int((Size / Length)*100)
                print(f"download: {Percent}% {url}")
            

