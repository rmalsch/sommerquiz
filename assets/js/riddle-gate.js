(function () {
  const GAME_COUNT = 6;
  const ALLOW_FINAL_SCREEN_FOR_TESTING = false;
  const steps = [...document.querySelectorAll("[data-riddle-step]")];
  const indicators = [...document.querySelectorAll("[data-riddle-step-indicator]")];
  const revealedCode = document.querySelector("[data-revealed-code]");
  const navigationPrevious = document.querySelector("[data-riddle-nav-prev]");
  const navigationNext = document.querySelector("[data-riddle-nav-next]");
  const configuredCode = String(window.SiteConfig?.accessPassword || "").trim();
  const concealedCode = ".".repeat(Math.max(Array.from(configuredCode).length, 6));
  const progressStorageKey = String(window.SiteConfig?.riddleProgressStorageKey || "sq_riddle_progress_v1");
  const completedSteps = new Set();
  let activeStep = 0;

  function loadProgress() {
    try {
      const saved = JSON.parse(localStorage.getItem(progressStorageKey) || "null");
      if (!saved || !Array.isArray(saved.completedSteps)) return null;

      const savedSteps = saved.completedSteps.filter((index) => (
        Number.isInteger(index) && index >= 0 && index < GAME_COUNT
      ));
      const savedActiveStep = Number.isInteger(saved.activeStep) ? saved.activeStep : 0;

      return {
        completedSteps: [...new Set(savedSteps)],
        activeStep: Math.max(0, Math.min(GAME_COUNT, savedActiveStep))
      };
    } catch (error) {
      return null;
    }
  }

  function saveProgress() {
    try {
      localStorage.setItem(progressStorageKey, JSON.stringify({
        completedSteps: [...completedSteps].sort((a, b) => a - b),
        activeStep
      }));
    } catch (error) {
      // Das Spiel bleibt auch ohne verfügbaren lokalen Speicher nutzbar.
    }
  }

  function clearSavedProgress() {
    try {
      localStorage.removeItem(progressStorageKey);
    } catch (error) {
      // Das Zurücksetzen der laufenden Seite funktioniert trotzdem.
    }
  }

  function areAllGamesComplete() {
    return completedSteps.size === GAME_COUNT;
  }

  function canOpenFinalScreen() {
    return ALLOW_FINAL_SCREEN_FOR_TESTING || areAllGamesComplete();
  }

  function setStep(index) {
    activeStep = index;
    if (index === GAME_COUNT && ALLOW_FINAL_SCREEN_FOR_TESTING && revealedCode) {
      revealedCode.textContent = configuredCode || "Code fehlt in der Config";
    }
    steps.forEach((step) => {
      step.classList.toggle("is-active", Number(step.dataset.riddleStep) === index);
    });
    indicators.forEach((indicator) => {
      const indicatorIndex = Number(indicator.dataset.riddleStepIndicator);
      indicator.classList.toggle("is-active", indicatorIndex === index);
      indicator.classList.toggle("is-complete", completedSteps.has(indicatorIndex));
    });
    if (navigationPrevious) {
      navigationPrevious.disabled = index <= 0;
      navigationPrevious.classList.toggle("is-hidden", index <= 0);
    }
    if (navigationNext) {
      navigationNext.disabled = index >= GAME_COUNT || (index === GAME_COUNT - 1 && !canOpenFinalScreen());
      navigationNext.classList.toggle("is-hidden", index >= GAME_COUNT);
    }
    saveProgress();
  }

  function showFeedback(index, text, tone = "neutral") {
    const feedback = document.querySelector(`[data-riddle-feedback="${index}"]`);
    if (!feedback) return;
    feedback.hidden = false;
    feedback.textContent = text;
    feedback.dataset.tone = tone;
  }

  function hideFeedback(index) {
    const feedback = document.querySelector(`[data-riddle-feedback="${index}"]`);
    if (!feedback) return;
    feedback.hidden = true;
    feedback.textContent = "";
    delete feedback.dataset.tone;
  }

  function formatMoves(count) {
    return `${count} ${count === 1 ? "Zug" : "Züge"}`;
  }

  function completeStep(index) {
    if (completedSteps.has(index)) return;
    completedSteps.add(index);
    if (areAllGamesComplete() && revealedCode) {
      revealedCode.textContent = configuredCode || "Code fehlt in der Config";
    }
    setStep(activeStep);
  }

  const wordleData = window.WordleWords || {};
  const wordleWords = Array.isArray(wordleData.solutionWords) && wordleData.solutionWords.length
    ? wordleData.solutionWords
    : ["SONNE", "JOKER", "RUNDE", "FRAGE", "ABEND", "KARTE", "LOGIK", "MUSIK", "PARTY"];
  const wordleAllowedWords = new Set(
    Array.isArray(wordleData.allowedWords) && wordleData.allowedWords.length
      ? wordleData.allowedWords
      : wordleWords
  );
  const wordleBoard = document.querySelector("[data-wordle-board]");
  const wordleKeyboard = document.querySelector("[data-wordle-keyboard]");
  const wordleStatus = document.querySelector("[data-wordle-status]");
  let wordleSecret = "";
  let wordleRow = 0;
  let wordleGuess = "";
  let wordleDone = false;

  function setWordleStatus(text, tone = "neutral") {
    if (!wordleStatus) return;
    wordleStatus.textContent = text;
    wordleStatus.dataset.tone = tone;
  }

  function setWordleSecret() {
    wordleSecret = wordleWords[Math.floor(Math.random() * wordleWords.length)];
  }

  function buildWordleBoard() {
    if (!wordleBoard) return;
    wordleBoard.innerHTML = "";
    for (let row = 0; row < 6; row += 1) {
      const rowNode = document.createElement("div");
      rowNode.className = "wordle-row";
      for (let col = 0; col < 5; col += 1) {
        const tile = document.createElement("span");
        tile.className = "wordle-tile";
        tile.dataset.wordleTile = `${row}-${col}`;
        rowNode.appendChild(tile);
      }
      wordleBoard.appendChild(rowNode);
    }
  }

  function createWordleKey(value, label, wide = false) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `wordle-key${wide ? " is-wide" : ""}`;
    button.dataset.wordleKey = value;
    button.textContent = label;
    return button;
  }

  function buildWordleKeyboard() {
    if (!wordleKeyboard) return;
    const rows = ["QWERTZUIOPÜ", "ASDFGHJKLÖÄ", "YXCVBNM"];
    wordleKeyboard.innerHTML = "";
    rows.forEach((letters, index) => {
      const row = document.createElement("div");
      row.className = "wordle-keyboard-row";
      if (index === 2) row.appendChild(createWordleKey("ENTER", "Enter", true));
      [...letters].forEach((letter) => row.appendChild(createWordleKey(letter, letter)));
      if (index === 2) row.appendChild(createWordleKey("BACK", "⌫", true));
      wordleKeyboard.appendChild(row);
    });
  }

  function getWordleTile(row, col) {
    return document.querySelector(`[data-wordle-tile="${row}-${col}"]`);
  }

  function renderWordleGuess() {
    for (let col = 0; col < 5; col += 1) {
      const tile = getWordleTile(wordleRow, col);
      if (!tile) continue;
      tile.textContent = wordleGuess[col] || "";
      tile.classList.toggle("is-filled", Boolean(wordleGuess[col]));
    }
  }

  function scoreWordleGuess(guess, secret) {
    const result = Array(5).fill("absent");
    const remaining = {};

    for (let index = 0; index < 5; index += 1) {
      if (guess[index] === secret[index]) {
        result[index] = "correct";
      } else {
        remaining[secret[index]] = (remaining[secret[index]] || 0) + 1;
      }
    }

    for (let index = 0; index < 5; index += 1) {
      if (result[index] === "correct") continue;
      const letter = guess[index];
      if (remaining[letter] > 0) {
        result[index] = "present";
        remaining[letter] -= 1;
      }
    }
    return result;
  }

  function updateWordleKey(letter, state) {
    const key = document.querySelector(`[data-wordle-key="${letter}"]`);
    if (!key) return;
    const rank = { absent: 1, present: 2, correct: 3 };
    const current = key.dataset.state || "";
    if ((rank[state] || 0) < (rank[current] || 0)) return;
    key.dataset.state = state;
    key.classList.remove("is-absent", "is-present", "is-correct");
    key.classList.add(`is-${state}`);
  }

  function submitWordleGuess() {
    if (wordleDone || activeStep !== 4) return;
    if (wordleGuess.length !== 5) {
      setWordleStatus("Erst fünf Buchstaben setzen.", "error");
      return;
    }
    if (!wordleAllowedWords.has(wordleGuess)) {
      setWordleStatus("Dieses Wort steht nicht in der Wörterliste.", "error");
      return;
    }

    const score = scoreWordleGuess(wordleGuess, wordleSecret);
    score.forEach((state, index) => {
      const tile = getWordleTile(wordleRow, index);
      tile?.classList.add(`is-${state}`);
      updateWordleKey(wordleGuess[index], state);
    });

    if (wordleGuess === wordleSecret) {
      wordleDone = true;
      setWordleStatus(`Geknackt: ${wordleSecret}. Der erste Buchstabe ist frei.`, "success");
      completeStep(4);
      return;
    }

    wordleRow += 1;
    wordleGuess = "";
    if (wordleRow >= 6) {
      wordleDone = true;
      setWordleStatus(`Keine Versuche mehr. Das Wort war ${wordleSecret}. Starte ein neues Wort.`, "error");
      return;
    }
    setWordleStatus(`${6 - wordleRow} Versuche übrig.`);
  }

  function handleWordleInput(value) {
    if (wordleDone || activeStep !== 4) return;
    if (value === "ENTER") {
      submitWordleGuess();
      return;
    }
    if (value === "BACK") {
      wordleGuess = wordleGuess.slice(0, -1);
      renderWordleGuess();
      return;
    }
    if (/^[A-ZÄÖÜ]$/.test(value) && wordleGuess.length < 5) {
      wordleGuess += value;
      renderWordleGuess();
    }
  }

  function resetWordle() {
    setWordleSecret();
    wordleRow = 0;
    wordleGuess = "";
    wordleDone = false;
    buildWordleBoard();
    buildWordleKeyboard();
    setWordleStatus("Neues Wort bereit. Sechs Versuche.");
  }

  wordleKeyboard?.addEventListener("click", (event) => {
    const key = event.target.closest("[data-wordle-key]");
    if (key) handleWordleInput(key.dataset.wordleKey);
  });

  document.addEventListener("keydown", (event) => {
    if (activeStep !== 4 || wordleDone) return;
    if (event.key === "Enter") {
      event.preventDefault();
      handleWordleInput("ENTER");
    } else if (event.key === "Backspace") {
      event.preventDefault();
      handleWordleInput("BACK");
    } else if (/^[a-zA-ZäöüÄÖÜ]$/.test(event.key)) {
      handleWordleInput(event.key.toLocaleUpperCase("de-DE"));
    }
  });

  document.querySelector("[data-wordle-reset]")?.addEventListener("click", resetWordle);

  const mastermindTokens = ["sun", "green", "blue", "red", "white", "violet"];
  const mastermindSlots = [...document.querySelectorAll("[data-mm-slot]")];
  const mastermindHistory = document.querySelector("[data-mm-history]");
  const mastermindStatus = document.querySelector("[data-mm-status]");
  let mastermindSecret = [];
  let mastermindGuess = [];
  let mastermindAttempts = 0;
  let mastermindLocked = false;

  function setMastermindStatus(text, tone = "neutral") {
    if (!mastermindStatus) return;
    mastermindStatus.textContent = text;
    mastermindStatus.dataset.tone = tone;
  }

  function renderMastermindSlots() {
    mastermindSlots.forEach((slot, index) => {
      const value = mastermindGuess[index] || "";
      slot.dataset.mmValue = value;
      slot.classList.toggle("is-filled", Boolean(value));
    });
  }

  function resetMastermind() {
    mastermindSecret = Array.from(
      { length: 4 },
      () => mastermindTokens[Math.floor(Math.random() * mastermindTokens.length)]
    );
    mastermindGuess = [];
    mastermindAttempts = 0;
    mastermindLocked = false;
    if (mastermindHistory) mastermindHistory.innerHTML = "";
    renderMastermindSlots();
    setMastermindStatus("Neuer Code erzeugt. Setze vier Pins. Doppelte Farben sind möglich.");
  }

  function scoreMastermindGuess(guess, secret) {
    let exact = 0;
    const remainingGuess = [];
    const remainingSecret = [];

    guess.forEach((token, index) => {
      if (token === secret[index]) {
        exact += 1;
      } else {
        remainingGuess.push(token);
        remainingSecret.push(secret[index]);
      }
    });

    let near = 0;
    remainingGuess.forEach((token) => {
      const matchIndex = remainingSecret.indexOf(token);
      if (matchIndex >= 0) {
        near += 1;
        remainingSecret.splice(matchIndex, 1);
      }
    });
    return { exact, near };
  }

  function addMastermindRow(guess, score) {
    if (!mastermindHistory) return;
    const row = document.createElement("div");
    row.className = "mastermind-row";
    row.innerHTML = `
      <div class="mastermind-guess">
        ${guess.map((token) => `<span class="mastermind-peg" data-mm-token="${token}" aria-label="${token}"></span>`).join("")}
      </div>
      <div class="mastermind-score">
        ${Array.from({ length: score.exact }, () => '<span class="is-exact" title="Exakt richtig"></span>').join("")}
        ${Array.from({ length: score.near }, () => '<span class="is-near" title="Richtige Farbe, falsche Position"></span>').join("")}
        ${Array.from({ length: 4 - score.exact - score.near }, () => '<span title="Kein Treffer"></span>').join("")}
      </div>`;
    mastermindHistory.prepend(row);
  }

  document.querySelectorAll(".mastermind-palette [data-mm-token]").forEach((button) => {
    button.addEventListener("click", () => {
      if (mastermindLocked || activeStep !== 1 || mastermindGuess.length >= 4) return;
      mastermindGuess.push(button.dataset.mmToken);
      renderMastermindSlots();
      setMastermindStatus(`${mastermindGuess.length} / 4 Pins gesetzt.`);
    });
  });

  mastermindSlots.forEach((slot) => {
    slot.addEventListener("click", () => {
      if (mastermindLocked || activeStep !== 1) return;
      mastermindGuess.splice(Number(slot.dataset.mmSlot), 1);
      renderMastermindSlots();
      setMastermindStatus("Pin entfernt. Reihe weiterbauen.");
    });
  });

  document.querySelector("[data-mm-clear]")?.addEventListener("click", () => {
    if (mastermindLocked || activeStep !== 1) return;
    mastermindGuess = [];
    renderMastermindSlots();
    setMastermindStatus("Aktuelle Reihe geleert.");
  });

  document.querySelector("[data-mm-reset]")?.addEventListener("click", resetMastermind);

  document.querySelector("[data-mm-submit]")?.addEventListener("click", () => {
    if (mastermindLocked || activeStep !== 1) return;
    if (mastermindGuess.length !== 4) {
      setMastermindStatus("Erst vier Pins setzen, dann prüfen.", "error");
      return;
    }

    mastermindAttempts += 1;
    const score = scoreMastermindGuess(mastermindGuess, mastermindSecret);
    addMastermindRow(mastermindGuess, score);

    if (score.exact === 4) {
      mastermindLocked = true;
      setMastermindStatus(`Code in ${mastermindAttempts} Versuchen geknackt.`, "success");
      completeStep(1);
      return;
    }

    mastermindGuess = [];
    renderMastermindSlots();
    if (mastermindAttempts >= 8) {
      mastermindLocked = true;
      setMastermindStatus("Keine Versuche mehr. Erzeuge einen neuen Code für eine neue Runde.", "error");
      return;
    }
    setMastermindStatus(`${score.exact} exakt, ${score.near} versetzt. Noch ${8 - mastermindAttempts} Versuche.`);
  });

  const sequenceButtons = [...document.querySelectorAll("[data-sequence-cell]")];
  const sequencePlay = document.querySelector("[data-sequence-play]");
  const sequenceLengths = [4, 5, 6];
  let sequenceRounds = [];
  let sequenceRound = 0;
  let sequenceInput = [];
  let sequenceLocked = true;
  let sequenceTimers = [];

  function clearSequenceTimers() {
    sequenceTimers.forEach((timer) => window.clearTimeout(timer));
    sequenceTimers = [];
  }

  function createRandomSequence(length) {
    const sequence = [];
    while (sequence.length < length) {
      const next = Math.floor(Math.random() * sequenceButtons.length);
      if (next !== sequence[sequence.length - 1]) sequence.push(next);
    }
    return sequence;
  }

  function createSequenceRounds() {
    sequenceRounds = sequenceLengths.map(createRandomSequence);
  }

  function resetSequence() {
    clearSequenceTimers();
    createSequenceRounds();
    sequenceRound = 0;
    sequenceInput = [];
    sequenceLocked = true;
    if (sequencePlay) sequencePlay.disabled = false;
    sequenceButtons.forEach((button) => button.classList.remove("is-lit", "is-hit", "is-reset-flash"));
  }

  function resetSequenceAfterMistake() {
    resetSequence();
    if (sequencePlay) sequencePlay.disabled = true;
    sequenceButtons.forEach((button) => button.classList.add("is-reset-flash"));
    sequenceTimers.push(window.setTimeout(() => {
      sequenceButtons.forEach((button) => button.classList.remove("is-reset-flash"));
      if (sequencePlay) sequencePlay.disabled = false;
    }, 650));
  }

  sequencePlay?.addEventListener("click", () => {
    if (activeStep !== 2) return;
    clearSequenceTimers();
    sequenceInput = [];
    sequenceLocked = true;
    sequencePlay.disabled = true;
    const sequence = sequenceRounds[sequenceRound];
    showFeedback(2, `Runde ${sequenceRound + 1} von 3 läuft. Gut hinsehen.`);

    sequence.forEach((cell, index) => {
      const onTimer = window.setTimeout(() => {
        sequenceButtons[cell]?.classList.add("is-lit");
        const offTimer = window.setTimeout(() => sequenceButtons[cell]?.classList.remove("is-lit"), 380);
        sequenceTimers.push(offTimer);
      }, index * 560);
      sequenceTimers.push(onTimer);
    });

    sequenceTimers.push(window.setTimeout(() => {
      sequenceLocked = false;
      showFeedback(2, "Jetzt die Folge nachklicken.");
    }, sequence.length * 560 + 120));
  });

  sequenceButtons.forEach((button) => {
    button.addEventListener("click", () => {
      if (activeStep !== 2 || sequenceLocked) return;
      const value = Number(button.dataset.sequenceCell);
      const sequence = sequenceRounds[sequenceRound];
      sequenceInput.push(value);
      button.classList.add("is-hit");
      window.setTimeout(() => button.classList.remove("is-hit"), 160);

      if (value !== sequence[sequenceInput.length - 1]) {
        resetSequenceAfterMistake();
        showFeedback(2, "Falsches Feld. Neue Folgen, wieder ab Runde 1.", "error");
        return;
      }

      if (sequenceInput.length === sequence.length) {
        sequenceRound += 1;
        sequenceInput = [];
        sequenceLocked = true;
        if (sequenceRound >= sequenceRounds.length) {
          showFeedback(2, "Alle drei Folgen korrekt wiederholt.", "success");
          completeStep(2);
          return;
        }
        sequencePlay.disabled = false;
        showFeedback(2, `Runde ${sequenceRound} geschafft. Die nächste Folge wartet.`, "success");
      }
    });
  });

  const memoryGrid = document.querySelector("[data-memory-grid]");
  const memoryScore = document.querySelector("[data-memory-score]");
  const memoryReset = document.querySelector("[data-memory-reset]");
  const memoryLoading = document.querySelector("[data-memory-loading]");
  const MEMORY_MAX_MOVES = 16;
  const memoryItems = [
    { id: "vier-gewinnt", src: "assets/images/sq2025/memory/vier-gewinnt.png", alt: "Vier gewinnt" },
    { id: "buzzer", src: "assets/images/sq2025/memory/buzzer.png", alt: "Buzzer" },
    { id: "hut", src: "assets/images/sq2025/memory/hut.png", alt: "Hut" },
    { id: "joker", src: "assets/images/sq2025/memory/joker.png", alt: "Joker" },
    { id: "musik", src: "assets/images/sq2025/memory/musik.png", alt: "Musik" },
    { id: "pfote", src: "assets/images/sq2025/memory/pfote.png", alt: "Pfote" },
    { id: "raetsel", src: "assets/images/sq2025/memory/raetsel.png", alt: "Rätsel" },
    { id: "sonne", src: "assets/images/sq2025/memory/sonne.png", alt: "Sonne" },
    { id: "whiteboard", src: "assets/images/sq2025/memory/whiteboard.png", alt: "Whiteboard" }
  ];
  let openCards = [];
  let matchedPairs = 0;
  let memoryMoves = 0;
  let memoryLocked = false;
  let memoryRestartTimer = null;
  let memoryPeekTimer = null;
  let memoryTurnTimer = null;
  let memoryAssetsPromise = null;
  let memoryAssetsReady = false;
  let memoryBuildToken = 0;

  function shuffle(items) {
    const result = [...items];
    for (let index = result.length - 1; index > 0; index -= 1) {
      const randomIndex = Math.floor(Math.random() * (index + 1));
      [result[index], result[randomIndex]] = [result[randomIndex], result[index]];
    }
    return result;
  }

  function updateMemoryScore() {
    if (memoryScore) memoryScore.textContent = `${memoryMoves} / ${MEMORY_MAX_MOVES} Züge`;
  }

  function setMemoryLoadingText(text) {
    if (!memoryLoading) return;
    memoryLoading.hidden = false;
    memoryLoading.textContent = text;
  }

  function loadMemoryImage(item, retriesLeft = 2) {
    return new Promise((resolve, reject) => {
      const image = new Image();
      image.onload = () => {
        if (typeof image.decode !== "function") {
          resolve();
          return;
        }
        image.decode().then(resolve).catch(resolve);
      };
      image.onerror = () => reject(new Error(`memory-image-failed:${item.id}`));
      image.src = item.src;
    }).catch((error) => {
      if (retriesLeft <= 0) throw error;
      return new Promise((resolve) => window.setTimeout(resolve, 1200))
        .then(() => loadMemoryImage(item, retriesLeft - 1));
    });
  }

  function preloadMemoryAssets() {
    if (memoryAssetsReady) return Promise.resolve();
    if (memoryAssetsPromise) return memoryAssetsPromise;

    let loadedCount = 0;
    setMemoryLoadingText(`Motive werden geladen: ${loadedCount} von ${memoryItems.length}.`);
    memoryAssetsPromise = Promise.all(memoryItems.map((item) => (
      loadMemoryImage(item).then(() => {
        loadedCount += 1;
        setMemoryLoadingText(`Motive werden geladen: ${loadedCount} von ${memoryItems.length}.`);
      })
    )))
      .then(() => {
        memoryAssetsReady = true;
      })
      .catch((error) => {
        memoryAssetsPromise = null;
        setMemoryLoadingText("Die Motive konnten noch nicht vollständig geladen werden. Tippe auf „Neu mischen“, um es erneut zu versuchen.");
        throw error;
      });

    return memoryAssetsPromise;
  }

  function buildMemory(showShuffleFlash = true) {
    if (!memoryGrid) return;
    window.clearTimeout(memoryRestartTimer);
    window.clearTimeout(memoryPeekTimer);
    window.clearTimeout(memoryTurnTimer);
    matchedPairs = 0;
    memoryMoves = 0;
    memoryLocked = true;
    memoryBuildToken += 1;
    const buildToken = memoryBuildToken;
    openCards = [];
    hideFeedback(0);
    updateMemoryScore();
    memoryGrid.innerHTML = "";
    shuffle([...memoryItems, ...memoryItems]).forEach((item, index) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "memory-card";
      button.dataset.memoryId = item.id;
      button.dataset.memoryIndex = String(index);
      button.setAttribute("aria-label", "Verdeckte Memory-Karte");
      button.disabled = !memoryAssetsReady;
      button.innerHTML = `<img class="${item.imageClass || ""}" src="${item.src}" alt="${item.alt}" loading="eager" decoding="async" draggable="false" />`;
      if (showShuffleFlash) button.classList.add("is-shuffle-flash");
      memoryGrid.appendChild(button);
    });
    preloadMemoryAssets()
      .then(() => {
        if (buildToken !== memoryBuildToken) return;
        const unlockDelay = showShuffleFlash ? 650 : 0;
        memoryPeekTimer = window.setTimeout(() => {
          if (buildToken !== memoryBuildToken) return;
          memoryGrid.querySelectorAll(".memory-card.is-shuffle-flash").forEach((card) => card.classList.remove("is-shuffle-flash"));
          memoryGrid.querySelectorAll(".memory-card").forEach((card) => { card.disabled = false; });
          memoryLocked = false;
          if (memoryLoading) memoryLoading.hidden = true;
        }, unlockDelay);
      })
      .catch(() => {
        if (buildToken !== memoryBuildToken) return;
        memoryGrid.querySelectorAll(".memory-card.is-shuffle-flash").forEach((card) => card.classList.remove("is-shuffle-flash"));
        memoryLocked = true;
      });
  }

  function restartMemoryAfterLimit() {
    memoryLocked = true;
    showFeedback(0, "Das Zuglimit ist erreicht. Die Karten werden neu gemischt.", "error");
    memoryRestartTimer = window.setTimeout(() => {
      buildMemory();
    }, 1200);
  }

  function finishMemoryTurn() {
    memoryLocked = false;
    updateMemoryScore();
    if (matchedPairs === memoryItems.length) {
      showFeedback(0, "Alle neun Paare gefunden.", "success");
      completeStep(0);
      return;
    }
    if (memoryMoves >= MEMORY_MAX_MOVES) restartMemoryAfterLimit();
  }

  memoryGrid?.addEventListener("click", (event) => {
    if (activeStep !== 0 || memoryLocked) return;
    const card = event.target.closest(".memory-card");
    if (!card || card.classList.contains("is-open") || card.classList.contains("is-matched") || openCards.length >= 2) return;
    card.classList.add("is-open");
    openCards.push(card);
    if (openCards.length < 2) return;

    memoryLocked = true;
    memoryMoves += 1;
    updateMemoryScore();
    const [first, second] = openCards;
    if (first.dataset.memoryId === second.dataset.memoryId) {
      first.classList.add("is-matched");
      second.classList.add("is-matched");
      openCards = [];
      matchedPairs += 1;
      finishMemoryTurn();
      return;
    }

    memoryTurnTimer = window.setTimeout(() => {
      first.classList.remove("is-open");
      second.classList.remove("is-open");
      openCards = [];
      finishMemoryTurn();
    }, 700);
  });

  memoryReset?.addEventListener("click", () => buildMemory(true));

  const timingTracks = document.querySelector("[data-timing-tracks]");
  const timingToggle = document.querySelector("[data-timing-toggle]");
  const isNarrowTimingScreen = window.matchMedia("(max-width: 720px)").matches;
  const timingTargets = [0.26, 0.17, isNarrowTimingScreen ? 0.16 : 0.13];
  const timingSpeeds = [3.2, 4.1, isNarrowTimingScreen ? 4.3 : 4.7];
  let timingFrame = null;
  let timingStartedAt = 0;
  let timingPosition = 0;
  let timingHits = 0;
  let timingCenters = [];
  let timingRunning = false;
  let timingMarker = null;

  function randomBetween(min, max) {
    return min + Math.random() * (max - min);
  }

  function createTimingCenters() {
    const thirdRoundCenter = isNarrowTimingScreen
      ? (Math.random() < 0.5 ? randomBetween(0.20, 0.33) : randomBetween(0.67, 0.80))
      : (Math.random() < 0.5 ? randomBetween(0.15, 0.30) : randomBetween(0.70, 0.85));
    timingCenters = [
      randomBetween(0.32, 0.68),
      Math.random() < 0.5 ? randomBetween(0.17, 0.34) : randomBetween(0.66, 0.83),
      thirdRoundCenter
    ];
  }

  function appendTimingTrack(roundIndex) {
    if (!timingTracks) return;
    const width = timingTargets[roundIndex] || timingTargets[timingTargets.length - 1];
    const center = timingCenters[roundIndex] || 0.5;
    const track = document.createElement("div");
    track.className = "timing-track";
    track.dataset.timingRound = String(roundIndex);
    track.setAttribute("aria-label", `Impulsleiste ${roundIndex + 1}`);

    const zone = document.createElement("span");
    zone.className = "timing-zone";
    zone.style.left = `${(center - width / 2) * 100}%`;
    zone.style.width = `${width * 100}%`;

    timingMarker = document.createElement("span");
    timingMarker.className = "timing-marker";
    timingMarker.style.left = "0%";
    track.append(zone, timingMarker);
    timingTracks.appendChild(track);
    timingPosition = 0;
  }

  function animateTiming() {
    const elapsed = (performance.now() - timingStartedAt) / 1000;
    const speed = timingSpeeds[timingHits] || timingSpeeds[timingSpeeds.length - 1];
    timingPosition = (Math.sin(elapsed * speed - Math.PI / 2) + 1) / 2;
    if (timingMarker) timingMarker.style.left = `${timingPosition * 100}%`;
    timingFrame = window.requestAnimationFrame(animateTiming);
  }

  function resetTiming() {
    window.cancelAnimationFrame(timingFrame);
    timingHits = 0;
    timingPosition = 0;
    timingRunning = false;
    createTimingCenters();
    if (timingTracks) timingTracks.innerHTML = "";
    appendTimingTrack(0);
    if (timingToggle) {
      timingToggle.disabled = false;
      timingToggle.textContent = "Impuls starten";
    }
  }

  function startTimingRound() {
    timingRunning = true;
    if (timingToggle) timingToggle.textContent = "Impuls stoppen";
    timingStartedAt = performance.now();
    showFeedback(3, `Impuls ${timingHits + 1} von 3 läuft.`);
    window.cancelAnimationFrame(timingFrame);
    animateTiming();
  }

  function stopTimingRound() {
    window.cancelAnimationFrame(timingFrame);
    timingRunning = false;
    const width = timingTargets[timingHits] || timingTargets[timingTargets.length - 1];
    const center = timingCenters[timingHits] || 0.5;
    const min = center - width / 2;
    const max = center + width / 2;

    if (timingPosition >= min && timingPosition <= max) {
      timingHits += 1;
      if (timingHits >= 3) {
        if (timingToggle) {
          timingToggle.textContent = "Geschafft";
          timingToggle.disabled = true;
        }
        showFeedback(3, "Drei Treffer!", "success");
        completeStep(3);
        return;
      }
      if (timingToggle) timingToggle.textContent = "Nächsten Impuls starten";
      appendTimingTrack(timingHits);
      showFeedback(3, `Treffer. Das Fenster wird enger und schneller: ${timingHits} / 3.`, "success");
      return;
    }

    resetTiming();
    showFeedback(3, "Daneben. Nochmal von vorn.", "error");
  }

  timingToggle?.addEventListener("click", () => {
    if (activeStep !== 3) return;
    if (timingRunning) stopTimingRound();
    else startTimingRound();
  });

  const slidePuzzle = document.querySelector("[data-slide-puzzle]");
  const slideStatus = document.querySelector("[data-slide-status]");
  const slideReset = document.querySelector("[data-slide-reset]");
  const SLIDE_IMAGE = "assets/images/theme/logo-sq-web.jpg";
  const SLIDE_SIZE = 4;
  const SLIDE_TILE_COUNT = SLIDE_SIZE * SLIDE_SIZE;
  let slideBoard = [];
  let slideMoves = 0;
  let slideLocked = false;

  function slideNeighbors(emptyIndex) {
    const row = Math.floor(emptyIndex / SLIDE_SIZE);
    const col = emptyIndex % SLIDE_SIZE;
    const neighbors = [];
    if (row > 0) neighbors.push(emptyIndex - SLIDE_SIZE);
    if (row < SLIDE_SIZE - 1) neighbors.push(emptyIndex + SLIDE_SIZE);
    if (col > 0) neighbors.push(emptyIndex - 1);
    if (col < SLIDE_SIZE - 1) neighbors.push(emptyIndex + 1);
    return neighbors;
  }

  function isSlideSolved() {
    return slideBoard.every((value, index) => value === (index === SLIDE_TILE_COUNT - 1 ? null : index));
  }

  function renderSlidePuzzle() {
    if (!slidePuzzle) return;
    slidePuzzle.innerHTML = "";
    slideBoard.forEach((tileValue, boardIndex) => {
      const button = document.createElement("button");
      button.type = "button";
      button.dataset.slideIndex = String(boardIndex);
      if (tileValue === null) {
        button.className = "slide-tile is-empty";
        button.disabled = true;
        button.setAttribute("aria-label", "Freies Feld");
      } else {
        const sourceRow = Math.floor(tileValue / SLIDE_SIZE);
        const sourceCol = tileValue % SLIDE_SIZE;
        const backgroundStep = 100 / (SLIDE_SIZE - 1);
        button.className = "slide-tile";
        button.style.backgroundImage = `url("${SLIDE_IMAGE}")`;
        button.style.backgroundPosition = `${sourceCol * backgroundStep}% ${sourceRow * backgroundStep}%`;
        button.setAttribute("aria-label", `Bildteil ${tileValue + 1} verschieben`);
      }
      slidePuzzle.appendChild(button);
    });
  }

  function resetSlidePuzzle() {
    slideBoard = Array.from({ length: SLIDE_TILE_COUNT - 1 }, (_, index) => index);
    slideBoard.push(null);
    let emptyIndex = SLIDE_TILE_COUNT - 1;
    let previousEmpty = -1;
    for (let turn = 0; turn < 320; turn += 1) {
      const options = slideNeighbors(emptyIndex).filter((index) => index !== previousEmpty);
      const moveIndex = options[Math.floor(Math.random() * options.length)];
      slideBoard[emptyIndex] = slideBoard[moveIndex];
      slideBoard[moveIndex] = null;
      previousEmpty = emptyIndex;
      emptyIndex = moveIndex;
    }
    if (isSlideSolved()) {
      const moveIndex = slideNeighbors(emptyIndex)[0];
      slideBoard[emptyIndex] = slideBoard[moveIndex];
      slideBoard[moveIndex] = null;
    }
    slideMoves = 0;
    slideLocked = false;
    if (slideStatus) slideStatus.textContent = "0 Züge";
    renderSlidePuzzle();
  }

  slidePuzzle?.addEventListener("click", (event) => {
    if (activeStep !== 5 || slideLocked) return;
    const tile = event.target.closest("[data-slide-index]");
    if (!tile) return;
    const tileIndex = Number(tile.dataset.slideIndex);
    const emptyIndex = slideBoard.indexOf(null);
    if (!slideNeighbors(emptyIndex).includes(tileIndex)) return;

    slideBoard[emptyIndex] = slideBoard[tileIndex];
    slideBoard[tileIndex] = null;
    slideMoves += 1;
    if (slideStatus) slideStatus.textContent = formatMoves(slideMoves);
    renderSlidePuzzle();

    if (isSlideSolved()) {
      slideLocked = true;
      if (slideStatus) slideStatus.textContent = `Bild gelöst nach ${formatMoves(slideMoves)}.`;
      completeStep(5);
    }
  });

  slideReset?.addEventListener("click", resetSlidePuzzle);

  function resetGameStates() {
    document.querySelectorAll("[data-riddle-feedback]").forEach((feedback) => {
      feedback.hidden = true;
      feedback.textContent = "";
      delete feedback.dataset.tone;
    });
    if (revealedCode) revealedCode.textContent = concealedCode;
    resetSequence();
    buildMemory(false);
    resetTiming();
    resetMastermind();
    resetWordle();
    resetSlidePuzzle();
  }

  function resetRiddle() {
    completedSteps.clear();
    clearSavedProgress();
    resetGameStates();
    setStep(0);
  }

  function restoreRiddle() {
    const savedProgress = loadProgress();
    completedSteps.clear();
    savedProgress?.completedSteps.forEach((index) => completedSteps.add(index));
    resetGameStates();

    if (areAllGamesComplete() && revealedCode) {
      revealedCode.textContent = configuredCode || "Code fehlt in der Config";
    }

    const requestedStep = savedProgress?.activeStep || 0;
    const initialStep = requestedStep === GAME_COUNT && !canOpenFinalScreen()
      ? GAME_COUNT - 1
      : requestedStep;
    setStep(initialStep);
  }

  document.querySelector("[data-riddle-reset]")?.addEventListener("click", resetRiddle);

  function navigateToStep(index) {
    const targetStep = Math.max(0, Math.min(GAME_COUNT, index));
    if (targetStep === GAME_COUNT && !canOpenFinalScreen()) return;

    clearSequenceTimers();
    sequenceLocked = true;
    sequenceButtons.forEach((button) => button.classList.remove("is-lit", "is-hit", "is-reset-flash"));
    if (sequencePlay) sequencePlay.disabled = false;

    window.cancelAnimationFrame(timingFrame);
    timingRunning = false;
    if (timingToggle) {
      timingToggle.disabled = false;
      timingToggle.textContent = "Impuls starten";
    }
    setStep(targetStep);
  }

  navigationPrevious?.addEventListener("click", () => navigateToStep(activeStep - 1));
  navigationNext?.addEventListener("click", () => {
    navigateToStep(activeStep + 1);
  });

  restoreRiddle();
})();
