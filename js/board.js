var context;
var bufferLoader;
var settings;

// default options
var repeat = false; // Toggled by repeat button

window.onload = init;

// Holds all active buffers. Is used so that we can stop them at all times
var activeBuffers = [];

// mp3 files and their ids
var allSounds = {}; // Will be replaced with data contained in sounds.json
var markedIds = [];
var searchResults = [];
var searchIds = {}; // Maps ids to a file path
var soundfiles = []; // will be extracted from allSounds
var soundIds = []; // will be extracted from allSounds
var cats = []; // will be extracted from allSounds
var currentCat = ""; // will be replaced with first cat on load

var hotkeys = []; // holds the number representations of pressed keys that can be used as hotkeys

// buffer loader class - Can't be written in normal class style as test would fail
function BufferLoader(context, urlList) {
  this.context = context;
  this.urlList = urlList;
  this.bufferList = [];
  this.loadCount = 0;
}

BufferLoader.prototype.loadBuffer = function(url, index, callback) {
  // Load buffer asynchronously
  const loader = this;
  if (loader.bufferList[index]) {
    callback(loader.bufferList[index]);
    return;
  }
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
        callback(buffer);
        return;
      },
      error => {
        console.error("decodeAudioData error", error, url);
      }
    );
  };
  request.onerror = e => {
    alert("BufferLoader: XHR error");
    console.log(e);
  };

  request.send();
};
// END bufferloader class

// BEGIN custom code
function loadFilesInMemory() {
  window.AudioContext = window.AudioContext || window.webkitAudioContext;
  context = new AudioContext();

  bufferLoader = new BufferLoader(context, soundfiles);

  loadUIElements();
}

function makeSoundPath(cat, filename) {
  return [settings.soundDirName, cat, filename].join("/");
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
  searchResults = soundfiles;
  soundIds = fullIds();
  createCategoryTabs();
  setCurrentCat(cats[0]);
  loadFilesInMemory();
  cats.push("search");
}

function init() {
  $.getJSON("js/customizations.json", json => {
    $("#soundboard-title").text(json.title);
    $("#soundboard-head-title").text(json.title);
    settings = json;
    $.getJSON(`${settings.soundDirName}.json`, gotSoundJson);
    $("#search").on("input", function() {
      search($(this).val());
    });
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
  $(`#${getTabContentId(cat)} button.${cat}`).each((i, e) => {
    $(e).append(createBadge(catClass, i));
    markBtnById(e.id);
  });
}

function createButtonWrapper() {
  const wrapper = document.createElement("div");
  $(wrapper).addClass("col-xs-12 col-sm-6 col-md-4");
  const btnGroup = document.createElement("div");
  btnGroup.classList.add("btn-group", "play-btn-group");
  btnGroup.role = "group";
  wrapper.appendChild(btnGroup);
  return wrapper;
}

function usableCat(cat) {
  return cat.replace(/[^0-9a-zA-Z]/, "-");
}

function getBufferFromPath(path) {
  return new Promise(resolve => {
    const index = soundfiles.findIndex(f => f === path);
    bufferLoader.loadBuffer(path, index, buffer => {
      resolve(buffer);
    });
  });
}

function playSound(path, id) {
  getBufferFromPath(path).then(buffer => {
    if (!repeat) {
      window.setTimeout(
        () => markSoundPlaying(id, true),
        buffer.duration * 1000
      );
    } else {
      markedIds.push(id + "_repeat");
    }
    play(buffer, document.getElementById("gain").value, path);
    markSoundPlaying(id);
  });
}

function markSoundPlaying(id, stopped, force) {
  if (stopped) {
    const shadowId = findShadowId(id);
    _handleStoppedIds(id, force);
    if (shadowId) {
      _handleStoppedIds(shadowId, force);
    }
  } else {
    markedIds.push(id);
  }
  markBtnById(id);
}

function findShadowId(id) {
  // An Id can have a sibling in search
  // If it's an search id it has a sibling in a category
  const path = getPathFromId(id);
  return id.startsWith("search")
    ? soundIds[soundfiles.indexOf(path)]
    : Object.keys(searchIds).find(sId => searchIds[sId] === path);
}

function _handleStoppedIds(id, force) {
  const rid = id + "_repeat";
  if (force) {
    markedIds = markedIds.filter(marked => marked !== id && marked !== rid);
  } else if (markedIds.includes(id)) {
    markedIds.splice(markedIds.indexOf(id), 1);
  }
}

function markBtnById(id) {
  const isInUse = someId =>
    markedIds.includes(someId) || markedIds.includes(`${someId}_repeat`);
  let inUse = isInUse(id);
  const shadowId = findShadowId(id);
  if (shadowId) {
    inUse = inUse || isInUse(shadowId);
    _markBtnById(shadowId, inUse);
  }
  _markBtnById(id, inUse);
}

function _markBtnById(id, inUse) {
  const button = $("#" + id);
  if (!button) {
    return;
  }
  const changeClasses = (btn, remove, add) => {
    btn.removeClass(remove);
    btn.addClass(add);
  };
  const stopBtn = $("#stop-" + id);
  if (inUse && !button.hasClass("active")) {
    button.addClass("active");
    changeClasses(stopBtn, "btn-disabled disabled", "btn-danger");
  } else if (!inUse && button.hasClass("active")) {
    button.removeClass("active");
    changeClasses(stopBtn, "btn-danger", "btn-disabled disabled");
  }
}

// {id, name, class, path}
function createSoundButton(config) {
  const addClasses = (e, classes) => e.classList.add(...classes.split(" "));
  const btn = document.createElement("button");
  btn.type = "button";
  if (config.name.length > 33) {
    config.name = config.name.slice(0, 30) + "...";
  }
  btn.innerHTML = "<strong>" + config.name + "</strong>";
  btn.id = config.id;
  btn.onclick = function() {
    playSound(config.path, config.id);
  };
  // spaced-button
  addClasses(btn, `${config.class} btn btn-default spaced-button play-button`);
  getBufferFromPath(config.path).then(buffer => {
    btn.title = `Plays ${config.name} (${Math.round(buffer.duration)}s)`;
  });
  const deleteBtn = document.createElement("button");
  deleteBtn.type = "button";
  addClasses(
    deleteBtn,
    "btn spaced-button file-stop-btn btn-disabled disabled"
  );
  deleteBtn.id = `stop-${config.id}`;
  deleteBtn.title = `Stops ${config.name}`;
  deleteBtn.onclick = () => stopPlaying(config.id);
  const deleteIcon = document.createElement("i");
  deleteBtn.id = `stop-${config.id}`;
  addClasses(deleteIcon, "glyphicon glyphicon-stop");
  deleteBtn.appendChild(deleteIcon);
  const wrapper = createButtonWrapper();
  wrapper.childNodes[0].appendChild(btn);
  wrapper.childNodes[0].appendChild(deleteBtn);
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
  searchIds = {};
  files.forEach((path, i) => {
    searchIds[`search-${i}`] = path;
  });
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
  displayPlayButtons();
  createHotkeyElements();
}

function isNumeric(input) {
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

function play(buffer, gain, path) {
  const source = context.createBufferSource();
  source.buffer = buffer;
  if (repeat) {
    source.loop = true;
    toggleRepeat();
  }
  source.path = path;
  activeBuffers.push(source);

  const gainNode = context.createGain();
  gainNode.gain.value = isNumeric(gain) && gain > 0 ? gain / 100 : 0;
  gainNode.path = path;
  activeBuffers.push(gainNode);

  source.connect(gainNode);
  gainNode.connect(context.destination);
  source.start(0);
}

function stopPlaying(id) {
  if (!id) {
    activeBuffers.forEach(b => b.disconnect(0));
    activeBuffers = [];
    markedIds.slice(0).forEach(id => {
      markSoundPlaying(id, true, true);
    });
  } else {
    stopPlayingFile(id);
  }
}

function stopPlayingFile(id) {
  const path = getPathFromId(id);
  activeBuffers
    .filter(b => b.path === path)
    .forEach(b => {
      b.disconnect(0);
    });
  activeBuffers = activeBuffers.filter(b => b.path !== path);
  markSoundPlaying(id, true, true);
}

function getPathFromId(id) {
  return id.startsWith("search")
    ? searchIds[id]
    : soundfiles[soundIds.indexOf(id)];
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
  const id = usableCat(currentCat) + "-" + randIndex;
  $(`#${id}`).focus();
  playSound(
    isSearch ? randomSound : makeSoundPath(currentCat, randomSound),
    id
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
