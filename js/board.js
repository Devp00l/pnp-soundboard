var context;
var bufferLoader;

// default options
var repeat = false; // Toggled by repeat button

window.onload = init;

// Is used for loading in all the buffers which are then played!
var bList;

// Holds all active buffers. Is used so that we can stop them at all times
var activeBuffers = [];

// mp3 files and their ids
var allSounds = {}; // Will be replaced with data contained in sounds.json
var markedIds = [];
var searchResults = [];
var soundfiles = []; // will be extracted from allSounds
var soundIds = []; // will be extracted from allSounds
var cats = []; // will be extracted from allSounds
var currentCat = ""; // will be replaced with first cat on load

var hotkeys = []; // holds the number representations of pressed keys that can be used as hotkeys

// buffer loader class

function BufferLoader(context, urlList, callback) {
  this.context = context;
  this.urlList = urlList;
  this.onload = callback;
  this.bufferList = [];
  this.loadCount = 0;
}

function updateProgress(bar, loading) {
  loading = Math.floor(loading * 100);
  bar.attr("aria-valuenow", loading);
  bar.attr("style", `width: ${loading}%`);
  bar.html(loading + "%");
  if (loading === 100) {
    bar.removeClass("active");
  }
}

BufferLoader.prototype.loadBuffer = function(url, index) {
  // Load buffer asynchronously
  const loader = this;
  const bar = $("#loading-bar2");
  const request = new XMLHttpRequest();
  request.open("GET", url, true);
  request.responseType = "arraybuffer";
  request.onload = () => {
    // Asynchronously decode the audio file data in request.response
    loader.context.decodeAudioData(
      request.response,
      buffer => {
        if (!buffer) {
          alert("error decoding file data: " + url);
          return;
        }
        loader.bufferList[index] = buffer;
        updateProgress(bar, (loader.loadCount + 1) / loader.urlList.length);
        if (++loader.loadCount == loader.urlList.length) {
          loader.onload(loader.bufferList);
        }
      },
      error => {
        console.error("decodeAudioData error", error);
      }
    );
  };
  request.onerror = e => {
    alert("BufferLoader: XHR error");
    console.log(e);
  };

  request.send();
};

BufferLoader.prototype.load = function() {
  const bar = $("#loading-bar");
  for (let i = 0; i < this.urlList.length; ++i) {
    this.loadBuffer(this.urlList[i], i);
    updateProgress(bar, (i + 1) / this.urlList.length);
  }
};
// END bufferloader class

// BEGIN custom code
function loadFilesInMemory() {
  window.AudioContext = window.AudioContext || window.webkitAudioContext;
  context = new AudioContext();

  bufferLoader = new BufferLoader(context, soundfiles, finishedLoading);

  bufferLoader.load();
}

function makeSoundPath(cat, filename) {
  return ["sounds", cat, filename].join("/");
}

function fullPathCat(cat) {
  return allSounds[cat].map(fn => makeSoundPath(cat, fn));
}

function fullPath() {
  let paths = [];
  cats.forEach(key => (paths = paths.concat(fullPathCat(key))));
  return paths;
}

function fullIdCat(cat) {
  return allSounds[cat].map((fn, i) => usableCat(cat, fn) + "-" + i);
}

function fullIds() {
  let ids = [];
  cats.forEach(key => (ids = ids.concat(fullIdCat(key))));
  return ids;
}

function gotSoundJson(json) {
  allSounds = json;
  cats = Object.keys(json);
  soundfiles = fullPath();
  soundIds = fullIds();
  createCategoryTabs();
  setCurrentCat(cats[0]);
  loadFilesInMemory();
  cats.push("search");
}

function init() {
  $.getJSON("js/customisations.json", json => {
    $("#soundboard-title").text(json.title);
    $("#soundboard-head-title").text(json.title);
  });
  $.getJSON("sounds.json", gotSoundJson);
  $("#search").on("input", function() {
    search($(this).val());
  });
}

function search(s) {
  let fin = soundfiles;
  s.toLowerCase()
    .split(" ")
    .forEach(term => (fin = searchTerm(term, fin)));
  createSearchSoundButtons(fin);
  createCategoryButttonBadges("search");
  searchResults = fin;
  return fin;
}

function searchTerm(s, arr) {
  return arr.filter(sf => sf.toLowerCase().includes(s));
}

function generateListOfHotKeys() {
  for (let i = 48; i <= 57; i++) {
    hotkeys.push(i);
  }
  for (let i = 97; i <= 122; i++) {
    hotkeys.push(i);
  }
  for (let i = 65; i <= 90; i++) {
    hotkeys.push(i);
  }
}

function createHotkeyElements() {
  generateListOfHotKeys();
  cats.forEach(cat => {
    createCategoryButttonBadges(cat);
  });
}

function createBadge(catClass, i) {
  const badge = document.createElement("span");
  badge.classList.add("badge", "hotkey-badge", catClass + "-key");
  badge.style.marginLeft = "1.2em";
  badge.innerHTML = String.fromCharCode(hotkeys[i]);
  return badge;
}

function getTabContentId(cat) {
  return usableCat(cat) + "-tab-content";
}

function createCategoryButttonBadges(cat) {
  const catClass = usableCat(cat);
  $("#" + getTabContentId(cat) + " button").each((i, e) => {
    $(e).append(createBadge(catClass, i));
  });
}

function createButtonWrapper() {
  const wrapper = document.createElement("div");
  $(wrapper).addClass("col-xs-12 col-sm-6 col-md-4");
  return wrapper;
}

function usableCat(cat) {
  return cat.replace(/[^0-9a-zA-Z]/, "-");
}

function getBufferFromPath(path) {
  return bList[soundfiles.findIndex(f => f === path)];
}

function playSound(path, id) {
  const buffer = getBufferFromPath(path);
  markSoundPlaying(id);
  if (!repeat) {
    window.setTimeout(() => markSoundPlaying(id, true), buffer.duration * 1000);
  }
  play(buffer, document.getElementById("gain").value);
}

function markSoundPlaying(id, stopped) {
  const button = $("#" + id);
  const notPlaying = "btn-default";
  const playing = "btn-danger";
  if (stopped) {
    markedIds.splice(markedIds.indexOf(id), 1);
    if (!markedIds.includes(id)) {
      button.removeClass(playing);
      button.addClass(notPlaying);
    }
  } else {
    markedIds.push(id);
    button.addClass(playing);
    button.removeClass(notPlaying);
  }
}

// {id, name, class, path}
function createSoundButton(config) {
  const btn = document.createElement("button");
  const buttonColor = "btn-default"; // or info
  const buffer = getBufferFromPath(config.path);
  btn.title = [config.name, " (", Math.round(buffer.duration), "s)"].join("");
  btn.type = "button";
  if (config.name.length > 33) {
    config.name = config.name.slice(0, 30) + "...";
  }
  btn.innerHTML = "<strong>" + config.name + "</strong>";
  btn.id = config.id;
  btn.onclick = function() {
    playSound(config.path, config.id);
  };
  btn.classList.add(
    "btn",
    config.class,
    buttonColor,
    "btn-block",
    "spaced-button"
  );
  const wrapper = createButtonWrapper();
  wrapper.appendChild(btn);
  return wrapper;
}

function setCat(cat) {
  currentCat = cat;
}

function createCatgoryTab(cat) {
  const catClass = usableCat(cat);
  const tabButtonId = catClass + "-tab-btn";
  const tabContentId = getTabContentId(cat);
  const tabButton = $(
    "<li><a onclick=\"setCat('" +
      cat +
      '\')" href= "#' +
      tabContentId +
      '" id="' +
      tabButtonId +
      '" data-toggle="tab">' +
      cat.toUpperCase() +
      "</a></li>"
  );
  const tabContent = $(
    '<div class="tab-pane" id="' + tabContentId + '"></div>'
  );
  const tabButtons = $("#tabs-buttons");
  const tabContents = $("#tabs-contents");
  tabButtons.append(tabButton);
  tabContents.append(tabContent);
}

function createCategoryTabs() {
  cats.forEach(cat => createCatgoryTab(cat));
  createCatgoryTab("search");
}

function internalCategorySoundButtons(tabContentId, files, btnConfig) {
  files
    .map((fn, i) => {
      return createSoundButton(btnConfig(fn, i));
    })
    .forEach(btn => {
      const buttons = document.getElementById(tabContentId);
      buttons.appendChild(btn);
    });
}

function createCategorySoundButtons(cat, files) {
  const catClass = usableCat(cat);
  internalCategorySoundButtons(getTabContentId(cat), files, (fn, i) => ({
    id: catClass + "-" + i,
    class: catClass,
    name: fn.slice(0, -4),
    path: makeSoundPath(cat, fn)
  }));
}

function createSearchSoundButtons(files) {
  tabContentId = getTabContentId("search");
  $("#" + tabContentId).empty();
  internalCategorySoundButtons(tabContentId, files, (path, i) => ({
    id: "search-" + i,
    class: "search",
    name: path
      .split("/")
      .pop()
      .slice(0, -4),
    path: path
  }));
}

function displayPlayButtons() {
  Object.keys(allSounds).forEach(key =>
    createCategorySoundButtons(key, allSounds[key])
  );
}

function loadUIElements() {
  $("#loading").hide();

  displayPlayButtons();
  createHotkeyElements();
}

function finishedLoading(bufferList) {
  // HACK: Makes the parameter global so that we get access to it.
  // It is implicitly loaded
  bList = bufferList;

  loadUIElements();
}

function IsNumeric(input) {
  return input - 0 == input && ("" + input).trim().length > 0;
}

function toggleRepeat() {
  repeat = !repeat;
  const btn = $("#repeat");
  const defaultClasses = "btn-warning";
  const pressedClasses = "active btn-danger";
  if (repeat) {
    btn.removeClass(defaultClasses);
    btn.addClass(pressedClasses);
  } else {
    btn.removeClass(pressedClasses);
    btn.addClass(defaultClasses);
  }
}

function play(buffer, gain) {
  const source = context.createBufferSource();
  source.buffer = buffer;
  if (repeat) {
    source.loop = true;
    toggleRepeat();
  }
  activeBuffers.push(source);

  const gainNode = context.createGain();
  gainNode.gain.value = IsNumeric(gain) && gain > 0 ? gain / 100 : 0;
  activeBuffers.push(gainNode);

  source.connect(gainNode);
  gainNode.connect(context.destination);
  source.start(0);
}

function stopPlaying() {
  for (let i = 0; i < activeBuffers.length; i++) {
    activeBuffers[i].disconnect(0);
  }
  markedIds.slice(0).forEach(id => {
    markSoundPlaying(id, true);
  });
  activeBuffers = [];
}

function nextCat() {
  const nextIndex = cats.indexOf(currentCat) + 1;
  setCurrentCat(cats[nextIndex % cats.length]);
}

function previousCat() {
  const previousIndex = cats.indexOf(currentCat) + cats.length - 1;
  setCurrentCat(cats[previousIndex % cats.length]);
}

function setCurrentCat(cat) {
  currentCat = cat;
  $("#" + usableCat(cat) + "-tab-btn").click();
}

function playRandom() {
  const isSearch = currentCat === "search";
  const sounds = isSearch ? searchResults : allSounds[currentCat];
  const randIndex = Math.floor(Math.random() * sounds.length);
  const randomSound = sounds[randIndex];
  playSound(
    isSearch ? randomSound : makeSoundPath(currentCat, randomSound),
    usableCat(currentCat) + "-" + randIndex
  );
}

function hotButton(keyCode) {
  const index = hotkeys.indexOf(keyCode);
  if (index !== -1) {
    $("#" + usableCat(currentCat) + "-" + index).click();
  }
}

function volumeChange(changeBy) {
  const gain = document.getElementById("gain");
  let val = parseInt(gain.value, 10) + changeBy;
  if (val > 100) {
    val = 100;
  } else if (val < 0) {
    val = 0;
  }
  gain.value = val;
}

// hitting escape or enter will stop all sounds
document.onkeydown = function(e) {
  const code = e.keyCode;
  const target = e.target;
  const key = e.key;

  if (code === 16) {
    // Shift
    playRandom();
  }

  if (target.tagName === "INPUT") {
    if (target.id === "search") {
      setCurrentCat(cats[cats.length - 1]);
    }
    return;
  }

  if ([27, 8].includes(code)) {
    // Escape, Backspace
    stopPlaying();
  } else if (code === 17) {
    // Control
    toggleRepeat();
  } else if (code === 37) {
    // Arrow Left
    previousCat();
  } else if (code === 39) {
    // Arrow Right
    nextCat();
  } else if (code === 38) {
    // Arrow Up
    volumeChange(1);
  } else if (code === 40) {
    // Arrow Down
    volumeChange(-1);
  } else if (code === 18) {
    // Alt
    $("#search").focus();
  } else if (key.length === 1) {
    hotButton(key.charCodeAt(0));
  }
};
