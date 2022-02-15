
const bound_pck = "bound.pck";

var bound_patch_file = "";

var bound_current_version = "";
var bound_version_list = {}

var latest_online_version = "";
var latest_mainline_version = "";
var version_list = [];

var local_version = get_local_version();

var progress_percentage = 0;
set_progress(progress_percentage);

async function get_local_version() {
    var game_version = "";
    var game_version_file = "";

    if (os == "windows") {
        game_version_file = "/GameVersion.txt";
    } else if (os == "linux") {
        game_version_file = "/GameVersion.txt";
    } else if (os == "mac") {
        game_version_file = "/GameVersion.txt";
    }

    try {
        let response = await Neutralino.filesystem.readFile(_settings.storage_dir + "/Bound/" + game_version_file); 
        if (response) {
            generate_toast("Settings: loaded!");
            //console.log(`${response}`);
            game_version = response;
            //console.log(_settings);
        }
    } catch (err) {
        if (err.code == "NE_FS_FILRDER") {
            game_version = false
            console.log("No local game version file!");
        }
        //console.log(err)
    }

    return game_version;
}

async function get_online_version() {
    
    const random = Math.floor(Math.random() * 100);
    var url = _server_address + "bound/patches/latest.json?" + random;
    var response = await fetch(url);
    var latest = await response.json();

    latest_online_version = latest.version;
    latest_mainline_version = latest.mainline_versions[latest.mainline_versions.length - 1];
    version_list = latest.prev_versions

}


async function compare_version() {
    if (local_version != latest_online_version) {
        console.log("Game version does not match patch version!");
        return false
    } else {
        console.log("Game version matches patch version!");
        return true
    }
}


async function download_game() {
    var file_name = "";
    var url = "";

    console.log("OS: "+os)
    if (os == "Windows") {
        file_name = "bound.exe";
        url = _server_address + "bound/patches/" + latest_mainline_version + "/bound.exe";
    } else if (os == "Linux") {
        file_name = "bound.x86_64";
        url = _server_address + "bound/patches/" + latest_mainline_version + "/bound.x86_64";
    } else if (os == "Darwin") {
        file_name = "bound.app";
        url = _server_address + "bound/patches/" + latest_mainline_version + "/bound.app";
    }
    console.log("Downloading game: " + file_name);
    console.log("from: " + url);
    file_path = _settings.storage_dir + "/Bound/" + file_name;
    pck_path = _settings.storage_dir + "/Bound/bound.pck";


    let bound_executable = await Neutralino.os.execCommand('python ./bstools/download.py ' + url + ' ' + file_path).then(
        (value) => {
            console.log(value);
            console.log("Downloaded game: " + file_name);
            progress_percentage = progress_percentage + 20;
            set_progress(progress_percentage);

            return true;
        }
    );

    
    let bound_pck = await Neutralino.os.execCommand('python ./bstools/download.py ' + _server_address + "bound/patches/" + latest_mainline_version + "/bound.pck" + ' ' + pck_path).then(
        (value) => {
            console.log(value);
            console.log("Downloaded pck: " + bound_pck);
            progress_percentage = progress_percentage + 20;
            set_progress(progress_percentage);

            return true;
        }
    ).then(
        (value) => {
            console.log(value)
            if (value == true) {
                pv = latest_mainline_version;
                download_patch(pv);
                bound_pck_check = true;
            }
        }
    );

    //var response = await fetch(url).then(async function(response) {
    //    return response.blob();
    //}).then(async function() {
    //    var file_path = _settings.storage_dir + "/Bound/" + file_name;
    //    let info = Neutralino.os.execCommand('python ./bstools/download.py ' + url + ' ' + file_path).then(
    //        function(result) {
    //        progress_percentage = progress_percentage + 20;
    //        set_progress(progress_percentage);
//
    //        }
    //    );
    //})
    //.then(async function() {
    //    var pck_path = _settings.storage_dir + "/Bound/bound.pck";
    //    let info = Neutralino.os.execCommand('python ./bstools/download.py ' + _server_address + "bound/patches/" + latest_mainline_version + "/bound.pck" + ' ' + pck_path).then(
    //        function(response) {
    //            progress_percentage = 50;
    //            set_progress(progress_percentage);
    //            pv = latest_mainline_version;
    //            update_version(latest_mainline_version);
    //            download_patch(pv);
    //        }
    //    );
    //}
    //);
    
    

    //pv = latest_mainline_version;
    //download_patch(pv);
}

async function download_patch(patch_version) {
    var update_list = [];
    let current_version = local_version;
    let current_version_placement = 1;
    for (var i = 0; i < version_list.length; i++) {
        if (version_list[i] == current_version) {
            current_version_placement = i;
        }
    }

    for (var i = current_version_placement; i < version_list.length; i++) {
        update_list.push(version_list[i]);
    }

    progress_per_patch = 10 / update_list.length;

    for (var i = 0; i < update_list.length; i++) {
        var url = _server_address + "bound/patches/" + update_list[i] + "/bound-patch.patch";
        var response = await fetch(url).then(function(response) {
            return response.blob();
        }).then(async function(blob) {
            return blob.text()
        }).then(async function(text){
            var file_name = update_list[i] + ".patch";
            var file_path = _settings.storage_dir + "/Bound/temp/" + file_name;
            console.log(file_path)
            let info = await Neutralino.filesystem.writeFile(file_path, text).catch(function () {
                console.log("Promise Rejected");
           });
        })
        
        .catch(async function(err) {
            console.log(err);
        });
        await patch_game("bound.pck", update_list[i]);
        update_version(update_list[i])

        progress_percentage = progress_percentage + progress_per_patch;
        set_progress(progress_percentage)
        console.log("Downloaded patch + Applied: " + update_list[i]);
    }
}



async function patch_game(game_file, patch_file) {
    generate_toast("Patching game (patch version: " + patch_file + ")");
    // TODO: Rename the current file to a backup name, then apply the patch and create the original file
    var oldfile = _settings.storage_dir + "/Bound/"+game_file;
    var newfile = _settings.storage_dir + "/Bound/"+game_file+".new";
    var patchfile = _settings.storage_dir + "/Bound/temp/"+patch_file+".patch";
    var os_extensions = "";

    if (os == "Windows") {
        os_extensions = ".exe";
    }
    
    // Patch the file!
    await Neutralino.os.execCommand(`./bstools/${os}/bspatch${os_extensions} ${oldfile} ${newfile} ./${patchfile}`).then(function(info) {
        console.log(info);
        console.log("Patched: " + game_file);
        console.log("Version: " + patch_file);
    });
}

async function update_version(version) {
    await Neutralino.filesystem.writeFile(_settings.storage_dir + "/Bound/game_version.txt", version);
    local_version = get_local_version()
}

//patch_file();
get_online_version();
get_local_version();
