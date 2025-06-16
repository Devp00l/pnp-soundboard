# PnP Soundboard using Web Audio API
<!---
TODO: Update image to match new 1.1.0 version
![example](soundboard-git-hub.png)
--->

## Demo

You can find the demo [here](https://devp00l.github.io/pnp-soundboard).

## Description
The focus of this soundboard is to be able to play sounds during pen and paper as quickly as possible.

This soundboard offers the following features:

* Search
* Dynamic hotkeys (up to 61 buttons per category)
* Volume regulation
* Categories
* Easy to customize
* Can be used with keyboard only
* Works OS independent
* Can be used with just a browser (server-client infrastructure)
* Uses Web Sound API (HTML5)
* Parallel played sounds

## Installation

### Requirements
You need a installed version of [node](https://nodejs.org/en/download/). Recommend is the latest LTS version.

### Installation

1. Pull this Repository either through `git clone` or download and extract the zip file
2. Run `npm install` inside the new directory in a terminal to install the local dependencies

#### How to open a terminal in the file browser?

Always navigate to the path where you want to open the terminal first.

For Windows users:
Click on `File > Open Powershell`.

For Linux users:
Depends on your file browser. In most you can just right click and than click on `Open Terminal here` (or similar)

For Mac users:
Click on `Finder > Services > New Terminal at Folder`

## Usage

1. Add sounds into `./sounds/$category/$sound_title.mp3`
2. Run `npm start` inside the new directory in a terminal to spin up the server, than automatically a new tab is opened in your default browser.

I've tested it on Linux (Ubuntu 18.04, Ubuntu 16.04) and Windows (10 Pro) on Firefox (67, 73) and Chrome (74, 78) and will work likely for
future version.

As it uses node the server can run on all node supported platforms (nearly everything).
The soundboard content can be consumed by any modern browser (it should support HTML5).

### The local server

The soundboard uses [live-server](https://www.npmjs.com/package/live-server), as it automatically
reloads the soundboard on file changes and automatically opens a window when spinning it up.

### Update sounds

Put all sounds in sub directories in the `sounds` directory. The sub directories are used as sub
categories. If the category is switched the short cuts will be remapped on the category you are
viewing. The sound structure will be updated every time you run `npm start`. That said the sounds
directory has the following structure `./sounds/${category name}/${sound title}.mp3`

#### What filetypes are supported?

All audio files that can be played in your browser.
You can see the supported HTML5 audio formats [here](https://en.wikipedia.org/wiki/HTML5_audio#Supported_audio_coding_formats).

That said "mp4" has only worked with the corresponding audio extension `m4a`.

The following audio types have *not* worked with the current chrome version on Linux:

* AIFF
* AMR
* WMA <-- Probably missing codecs on my side

The following types have worked:

* AAC
* FLAC
* M4A
* MP3
* OGG
* WAV
* WEBM

#### Where to get sounds?

Using [youtube-dl](https://ytdl-org.github.io/youtube-dl/) to get sounds from all [supported](https://ytdl-org.github.io/youtube-dl/supportedsites.html) streaming sides by using the command `youtube-dl -f 'bestaudio' $URL`.

From [soundboard](https://www.soundboard.com/) using [soundboard_dl](https://github.com/jlis/soundboard_dl) to download them via `php dl.php $sound_board_title`..

You can get sounds with  specified license from [soundbible](http://soundbible.com/).

Alternatively make your own sounds :)

### Use your own title

By running `npm start` the `js/example.customizations.json` will be copied to `js/customizations.json`,
which you can edit to set the title of your soundboard.

### Search through titles

You can now search through every category. You can focus the field by pressing `space`. Your
results will can be seen under the search tab. All hotkeys will be remapped on your search
results when viewing them.

### Hotkeys

Use `alt` to focus the search field.

Use `shift` to play a random tile from the currently chosen tab.

Use `backspace` or `escape` to stop all playing titles.

Use `arrow left` or `arrow right` to go to the next or previous tab.

Use `arrow up` or `arrow down` to increase or decrease the volume.

Use `control` to toggle the repeat next sound button.

Use the key presented on the buttons to trigger the button.

All hotkeys are deactivated if you are typing in an input field.

After you have clicked some button you can use the hotkeys of your
browser to trigger the button again by hitting `space` or `enter`.

## Unit tests

Unit tests can be run through running `npm test`. The test are run by the
[JEST testing framework](https://jestjs.io/). As the code itself is written in vanilla JS the
imports of the files into the test suite look kind of hacky. If you know any better way,
please submit a PR to change it :)

## Requests / Questions

If you have any questions or requests open an issue or shout really really loud out your window.

## Special thanks

This soundboard originated from [mlg-soundboard](https://github.com/tst/mlg-soundboard) that is why I want to thank [tst](https://github.com/tst) and all that helped him developing the [MLG Soundboard](https://github.com/tst/mlg-soundboard).
