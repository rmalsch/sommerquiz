const countdownEvents = [
    {
        time: new Date("July 4, 2025 12:00:00").getTime(),
        buttonId: "revealButton1",
        textId: "hiddenTextField1"
    },
    {
        time: new Date("July 8, 2025 12:00:00").getTime(),
        buttonId: "revealButton2",
        textId: "hiddenTextField2"
    },
    {
        time: new Date("July 12, 2025 12:00:00").getTime(),
        buttonId: "revealButton3",
        textId: "hiddenTextField3"
    }
];

function updateCountdown() {
    const now = Date.now();

    // Alle Buttons aktivieren, deren Zeit schon vorbei ist
    countdownEvents.forEach(event => {
        if (event.time <= now) {
            const btn = document.getElementById(event.buttonId);
            if (btn) btn.disabled = false;
        }
    });

    // Finde das nächste Event in der Zukunft
    const nextEvent = countdownEvents.find(event => event.time > now);

    if (!nextEvent) {
        // Kein zukünftiges Event mehr → Countdown auf 0 setzen
        document.getElementById("days").textContent = "0";
        document.getElementById("hours").textContent = "0";
        document.getElementById("minutes").textContent = "0";
        document.getElementById("seconds").textContent = "0";
        return;
    }

    // Countdown berechnen
    const timeLeft = nextEvent.time - now;

    const days = Math.floor(timeLeft / (1000 * 60 * 60 * 24));
    const hours = Math.floor((timeLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);

    document.getElementById("days").textContent = days;
    document.getElementById("hours").textContent = hours;
    document.getElementById("minutes").textContent = minutes;
    document.getElementById("seconds").textContent = seconds;

    // Wiederholen
    setTimeout(updateCountdown, 1000);
}

// Tipp-Anzeige toggeln
function toggleTextField(buttonId, textId) {
    const textField = document.getElementById(textId);
    const button = document.getElementById(buttonId);

    if (!textField || !button) return;

    const isHidden = textField.style.display === "none" || textField.style.display === "";
    textField.style.display = isHidden ? "block" : "none";

    // Hol festen Label-Text vom data-Attribut
    // const label = button.getAttribute("data-label") || "";

    // Setze Button-Text mit festem Label und dynamischem Zusatz
    // button.textContent = label + (isHidden ? " aus" : " an");
}


updateCountdown();
