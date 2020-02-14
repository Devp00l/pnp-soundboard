var fs = require("fs");

// Dirty but the only thing that really works
eval.apply(this, [
  fs.readFileSync("node_modules/jquery/dist/jquery.min.js").toString()
]);
eval.apply(this, [fs.readFileSync("js/board.js").toString()]);
settings = { soundDirName: "sounds" };
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
  const createEvent = (key, keyCode) => {
    document.dispatchEvent(
      new KeyboardEvent("keydown", {
        key: key,
        keyCode: keyCode
      })
    );
  };
  const expectBtnOuterHtml = (btn, cat, index, title, hotkey) => {
    let html = `<button type="button" id="${cat}-${index}" class="${cat} btn btn-default spaced-button play-button" title="Plays ${title} (0s)"><strong>${title}</strong>`;
    if (hotkey >= 0) {
      html += `<span class="badge hotkey-badge ${cat}-key" style="margin-left: 1.2em;">${hotkey}</span>`;
    }
    html += "</button>";
    expect(btn[0].outerHTML).toEqual(html);
  };

  describe("search", () => {
    it("should search one word", () => {
      expect(search("_1")).toEqual(["sounds/cat-1/STh_1.mp3"]);
      expect(search("else-1")).toEqual(["sounds/cat 2/else-1.mp3"]);
    });

    it("should search case insensitive", () => {
      expect(search("sth_1")).toEqual(["sounds/cat-1/STh_1.mp3"]);
    });

    it("should show search buttons", async () => {
      search("_1");
      const firstButton = $("#search-0");
      await getBufferFromPath("sounds/cat-1/STh_1.mp3");
      expectBtnOuterHtml(firstButton, "search", 0, "STh_1", 0);
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

  it("displays the right buttons", async () => {
    // 0-9 and a-z just dertermine the numeric id that is clicked
    await getBufferFromPath("sounds/cat-1/STh_1.mp3");
    expectBtnOuterHtml($("#cat-1-0"), "cat-1", 0, "STh_1", 0);
    await getBufferFromPath("sounds/cat 2/else-1.mp3");
    expectBtnOuterHtml($("#cat-2-0"), "cat-2", 0, "else-1");
    await getBufferFromPath("sounds/cat 2/else.2.mp3");
    expectBtnOuterHtml($("#cat-2-1"), "cat-2", 1, "else.2");
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

  describe("playing", () => {
    const clickSoundBtn = async id => {
      const index = soundIds.indexOf(id);
      $(`#${id}`).click();
      return getBufferFromPath(`#${soundfiles[index]}`);
    };

    beforeEach(() => {
      createEvent("Escape", 27); // Stops all playing sounds
      spyOn(window, "playSound").and.callThrough();
      spyOn(window, "markSoundPlaying").and.callThrough();
    });

    it("plays a sound", async () => {
      await clickSoundBtn("cat-1-0");
      expect(window.playSound).toBeCalledWith(
        "sounds/cat-1/STh_1.mp3",
        "cat-1-0"
      );
      expect(window.playSound).toHaveBeenCalledTimes(1);
      expect(window.markSoundPlaying).toBeCalledWith("cat-1-0");
      // Every sounds has two buffers (GainNode and AudioBufferSourceNode) which are connected.
      expect(activeBuffers.length).toEqual(2);
    });

    it("plays a sound multiple times", async () => {
      await clickSoundBtn("cat-1-0");
      await clickSoundBtn("cat-1-0");
      expect(activeBuffers.length).toEqual(4);
    });

    it("plays multiple sounds", async () => {
      await clickSoundBtn("cat-1-0");
      await clickSoundBtn("cat-1-0");
      await clickSoundBtn("cat-1-1");
      expect(activeBuffers.length).toEqual(6);
    });

    it("stops all running sounds", async () => {
      await clickSoundBtn("cat-1-0");
      await clickSoundBtn("cat-1-0");
      await clickSoundBtn("cat-1-1");
      $("#stop-all-sounds").click();
      expect(activeBuffers.length).toEqual(0);
    });

    it("plays and stop individual files", async () => {
      await clickSoundBtn("cat-1-0");
      await clickSoundBtn("cat-1-0");
      await clickSoundBtn("cat-1-1");
      $("#stop-cat-1-0").click();
      expect(
        activeBuffers.every(b => b.path !== "sounds/cat-1/STh_1.mp3")
      ).toBe(true);
      expect(activeBuffers.length).toEqual(2);
    });
  });

  describe("hotkeys", () => {
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
