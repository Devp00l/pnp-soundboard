var fs = require("fs");

// Dirty but the only thing that really works
eval.apply(this, [
  fs.readFileSync("node_modules/jquery/dist/jquery.min.js").toString()
]);
eval.apply(this, [fs.readFileSync("js/board.js").toString()]);
eval.apply(this, [
  fs.readFileSync("node_modules/bootstrap/dist/js/bootstrap.min.js").toString()
]);
eval.apply(this, [
  fs
    .readFileSync("node_modules/web-audio-test-api/build/web-audio-test-api.js")
    .toString()
]);

// init whole app
document.body.innerHTML = fs.readFileSync("index.html").toString();

window.XMLHttpRequest = function() {
  this.response = new ArrayBuffer(128);
  this.onload = () => null;
  this.open = () => null;
  this.send = () => this.onload();
  return this;
};

gotSoundJson({
  "cat-1": ["STh_1.mp3", "sth 2.mp3"],
  "cat 2": ["else-1.mp3", "else.2.mp3"],
  "cat.3": ["pnp.mp3"]
});

describe("test board", () => {
  describe("search", () => {
    it("should search one word", () => {
      expect(search("_1")).toEqual(["sounds/cat-1/STh_1.mp3"]);
      expect(search("else-1")).toEqual(["sounds/cat 2/else-1.mp3"]);
    });

    it("should search case insensitive", () => {
      expect(search("sth_1")).toEqual(["sounds/cat-1/STh_1.mp3"]);
    });

    it("should show search buttons", () => {
      search("_1");
      const firstButton = $("#search-0");
      expect(firstButton).not.toEqual({});
      expect(firstButton[0].outerHTML).toEqual(
        '<button title="STh_1 (0s)" type="button" id="search-0" class="btn search btn-default btn-block spaced-button"><strong>STh_1</strong><span class="badge hotkey-badge search-key" style="margin-left: 1.2em;">0</span></button>'
      );
    });

    it("should search two words", () => {
      expect(search("- _")).toEqual(["sounds/cat-1/STh_1.mp3"]);
    });
  });

  describe("dynamic file recognition", () => {
    it("should generate full paths out of allSounds", () => {
      expect(soundfiles).toEqual([
        "sounds/cat-1/STh_1.mp3",
        "sounds/cat-1/sth 2.mp3",
        "sounds/cat 2/else-1.mp3",
        "sounds/cat 2/else.2.mp3",
        "sounds/cat.3/pnp.mp3"
      ]);
    });

    it("should generate full ids out of allSounds", () => {
      expect(soundIds).toEqual([
        "cat-1-0",
        "cat-1-1",
        "cat-2-0",
        "cat-2-1",
        "cat-3-0"
      ]);
    });
  });

  it("displays the right buttons", () => {
    // 0-9 and a-z just dertermine the numeric id that is clicked
    expect($("#cat-1-0")[0].outerHTML).toEqual(
      '<button title="STh_1 (0s)" type="button" id="cat-1-0" class="btn cat-1 btn-default btn-block spaced-button"><strong>STh_1</strong><span class="badge hotkey-badge cat-1-key" style="margin-left: 1.2em;">0</span></button>'
    );
    expect($("#cat-2-0")[0].outerHTML).toEqual(
      '<button title="else-1 (0s)" type="button" id="cat-2-0" class="btn cat-2 btn-default btn-block spaced-button"><strong>else-1</strong><span class="badge hotkey-badge cat-2-key" style="margin-left: 1.2em;">0</span></button>'
    );
    expect($("#cat-2-1")[0].outerHTML).toEqual(
      '<button title="else.2 (0s)" type="button" id="cat-2-1" class="btn cat-2 btn-default btn-block spaced-button"><strong>else.2</strong><span class="badge hotkey-badge cat-2-key" style="margin-left: 1.2em;">1</span></button>'
    );
  });

  it("should change cats as planned", () => {
    expect(currentCat).toBe("cat-1");
    nextCat();
    expect(currentCat).toBe("cat 2");
    nextCat();
    expect(currentCat).toBe("cat.3");
    previousCat();
    expect(currentCat).toBe("cat 2");
    previousCat();
    expect(currentCat).toBe("cat-1");
  });

  describe("hotkeys", () => {
    const createEvent = (key, keyCode) => {
      document.dispatchEvent(
        new KeyboardEvent("keydown", {
          key: key,
          keyCode: keyCode
        })
      );
    };

    it("calls stopPlaying on escape and backspace", () => {
      spyOn(window, "stopPlaying");
      createEvent("Escape", 27);
      expect(window.stopPlaying).toHaveBeenCalledTimes(1);
      createEvent("Backspace", 8);
      expect(window.stopPlaying).toHaveBeenCalledTimes(2);
    });

    it("calls playRandom on shift", () => {
      spyOn(window, "playRandom");
      createEvent("Shift", 16);
      expect(window.playRandom).toHaveBeenCalled();
    });

    it("changes to next category on arrow right", () => {
      expect(currentCat).toBe("cat-1");
      createEvent("ArrowRight", 39);
      expect(currentCat).toBe("cat 2");
      createEvent("ArrowRight", 39);
      expect(currentCat).toBe("cat.3");
      createEvent("ArrowRight", 39);
      expect(currentCat).toBe("search");
      createEvent("ArrowRight", 39);
      expect(currentCat).toBe("cat-1");
    });

    it("changes to previous category on arrow left", () => {
      expect(currentCat).toBe("cat-1");
      createEvent("ArrowLeft", 37);
      expect(currentCat).toBe("search");
      createEvent("ArrowLeft", 37);
      expect(currentCat).toBe("cat.3");
      createEvent("ArrowLeft", 37);
      expect(currentCat).toBe("cat 2");
      createEvent("ArrowLeft", 37);
      expect(currentCat).toBe("cat-1");
    });

    it("increases the volume on arrow up", () => {
      const gain = document.getElementById("gain");
      expect(parseInt(gain.value)).toBe(10);
      createEvent("ArrowUp", 38);
      expect(parseInt(gain.value)).toBe(11);
      gain.value = 99;
      createEvent("ArrowUp", 38);
      expect(parseInt(gain.value)).toBe(100);
      createEvent("ArrowUp", 38);
      expect(parseInt(gain.value)).toBe(100);
      gain.value = 10;
    });

    it("decreases the volume on arrow down", () => {
      const gain = document.getElementById("gain");
      expect(parseInt(gain.value)).toBe(10);
      createEvent("ArrowDown", 40);
      expect(parseInt(gain.value)).toBe(9);
      gain.value = 1;
      createEvent("ArrowDown", 40);
      expect(parseInt(gain.value)).toBe(0);
      createEvent("ArrowDown", 40);
      expect(parseInt(gain.value)).toBe(0);
      gain.value = 10;
    });

    it("focuses search on Alt", () => {
      const search = document.getElementById("search");
      expect(document.activeElement).not.toBe(search);
      expect(document.hasFocus()).toBe(false);
      createEvent("alt", 18);
      expect(document.hasFocus()).toBe(true);
      expect(document.activeElement).toBe(search);
    });

    it("toggles repeat next song on control", () => {
      const repeat = document.getElementById("repeat");
      expect(repeat.className).toBe("btn btn-warning");
      createEvent("Control", 17);
      expect(repeat.className).toBe("btn active btn-danger");
      createEvent("Control", 17);
      expect(repeat.className).toBe("btn btn-warning");
    });

    describe("dynamic hotkeys", () => {
      let allKeys;

      beforeEach(() => {
        abc = "abcdefghijklmnopqrstuvwxyz";
        allKeys = "0123456789" + abc + abc.toUpperCase();
        spyOn(window, "hotButton");
      });

      it("should test hotkeys", () => {
        allKeys.split("").forEach(key => {
          createEvent(key, key.charCodeAt(0));
          expect(window.hotButton).toHaveBeenCalledWith(key.charCodeAt(0));
        });
      });
    });
  });
});
