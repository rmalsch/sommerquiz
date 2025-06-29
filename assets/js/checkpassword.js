function checkPassword() {
    function getSecret() {
        const codes = [81, 117, 105, 122, 109, 97, 115, 116, 101, 114];
        return codes.map(c => String.fromCharCode(c)).join("");
    }

    const correctPassword = getSecret();
    const input = document.getElementById("passwordInput").value.trim();
    const errorMessageElement = document.getElementById("errorMessage");

    const errorMessages = [
        "Falsches Passwort! Versuch es nochmal.",
        "Das war leider nichts...",
        "Nope, so einfach ist das nicht!",
        "Schon mal drüber nachgedacht, dass du falsch liegen könntest?",
        "Einmal tief durchatmen und nochmal probieren!",
        "War das ein Tippfehler?",
        "Mutig, aber falsch.",
        "Leider nein.",
        "Schön gedacht - aber falsch geraten!",
        "Versuch's mit der Macht des positiven Denkens. Und dem richtigen Passwort.",
        "Vielleicht ist das Passwort auch einfach beleidigt.",
        "Ein bisschen wärmer… aber immer noch eiskalt.",
        "Dieser Versuch zählt als künstlerischer Ausdruck.",
        "Fast so gut wie '1234' - aber eben nur fast.",
        "Ich bin nicht wütend, nur enttäuscht.",
        "Das Passwort ist irgendwo da draußen… aber nicht hier.",
        "Du bist nur ein paar hundert Millionen Möglichkeiten entfernt!",
        "Spoiler: Das war's nicht.",
        "Wenn du rätst, tust du es wenigstens mit Stil.",
        "Das war… kreativ.",
        "Vielleicht solltest du erst die Anleitung lesen?",
        "Schon mal 'bitte' gesagt?",
        "Quizgötter sagen: 'Unwürdig.'",
        "Das Passwort versteckt sich… und lacht gerade.",
        "Du kämpfst tapfer, aber der Endgegner ist stärker.",
        "Manchmal ist Schweigen auch keine Lösung. Jetzt vielleicht doch.",
        "Tastatur aus, Gehirn an!",
        "Das war keine Meisterleistung. Aber immerhin ein Versuch.",
        "Schon gut, jeder vertippt sich mal. Nur du … halt öfter.",
        "Einmal falsch abgebogen im Passwort-Dschungel?",
        "War das ein echter Versuch?",
        "Okay… also… nein.",
        "Ein Tropfen Wahrheit in einem Ozean aus Irrtum.",
        "Wenn das ein Escape Room wäre, wärst du noch drin.",
        "Nein. Und du bekommst auch keinen Trostpunkt fürs Mitmachen.",
        "Du hast das Passwort gerade traurig gemacht.",
        "Statistisch gesehen… war das zu erwarten.",
        "Wenn das eine Prüfung wäre, wärst du durchgefallen.",
        "Wenigstens ist das System geduldig. Im Gegensatz zu mir.",
        "Hast du das Passwort etwa gegoogelt?",
        "Das war so falsch, sogar der Server hat gelacht.",
        "Du bist wie ein schlechter Zauberer - keine Ahnung vom richtigen Spruch.",
        "Vielleicht hilft das richtige Passwort.",
        "Knapp daneben ist auch vorbei.",
        "Raten ist keine valide Authentifizierungsmethode.",
        "Es ist Sommer, aber das war eiskalt.",
        "Vielleicht morgen. Vielleicht nie.",
        "Schon wieder daneben. Du bist echt konsequent.",
        "Deine Tastatur kann nichts dafür.",
        "Ich spüre dein Passwort nicht… vielleicht liegt es daran, dass es falsch ist.",
        "Mut zur Lücke! Aber die ist hier zu groß.",
        "Interessanter Versuch. Aber nein.",
        "Selbst ChatGPT hätte das nicht geraten.",
        "Du hast dich wohl verklickt.",
        "Auf einer Skala von 1 bis Passwort: Das war eine 0.",
        "Der Code des Erfolgs... ist leider ein anderer.",
        "Wer nichts weiß, muss raten - aber bitte besser.",
        "Das war mutig. Und sinnlos.",
        "Vielleicht war das Passwort beleidigt und will gerade nicht.",
        "Das Passwort ist gerade nicht verfügbar. Bitte versuche es nie wieder.",
        "Du näherst dich dem Passwort mit der Eleganz eines Elefanten im Porzellanladen.",
        "Möglicherweise hast du versehentlich Quatsch eingegeben.",
        "404: Passwort not found.",
        "Auch mit Anlauf war das ein Bauchklatscher.",
        "Du spielst Passwortroulette. Und verlierst.",
        "War das ein Passwort oder eine zufällige Buchstabensuppe?",
        "Für diesen Versuch gibt's ein digitales Schulterklopfen. Aber keinen Zutritt.",
        "Plot-Twist: Das wahre Passwort war die Reise. Aber Reisen allein schalten leider nichts frei.",
        "Du bist ein paar Lichtjahre vom Ziel entfernt.",
        "Ein mutiger Schritt - bloß leider in die falsche Richtung",
        "Ein Passwortversuch, der in die Geschichte eingeht - als Fehlschlag.",
        "Ein Schritt mehr auf dem Irrweg.",
        "YOU DIED"
    ];

    if (input.toLowerCase() === correctPassword.toLowerCase()) {
        errorMessageElement.textContent = "Wow! Du hast das fals.. äh, richtige Passwort eingegeben!";
        errorMessageElement.style.display = "block";
        errorMessageElement.style.color = "#77ff6b";
        errorMessageElement.style.backgroundColor = "#6bff891a";

        document.querySelectorAll(".navHideOnUnlock").forEach(el => {
            el.style.visibility = "hidden";
        });

        document.querySelectorAll(".geheimContent").forEach(el => {
            el.style.display = "block";
        });

        document.querySelectorAll(".geheimNav").forEach(el => {
            el.style.visibility = "visible";
        });

        document.getElementById("headline").textContent = "Willkommen!";
        document.getElementById("introText").style.textTransform = "none";
        document.getElementById("introText").innerHTML = "Der Sommer ist da - und mit ihm das Quiz des Jahres! Denn es ist wieder so weit: Das 2. Sommerquiz steht an! Ihr seid herzlich eingeladen zu einem Abend voller kniffliger Fragen, verrückter Spiele und garantiert guter Laune. Das letzte Mal war ein echtes Highlight - nicht nur für mich als Gastgeber, Freund und Quizmaster, sondern offenbar auch für euch. Viele von euch haben mich seitdem auf eine Fortsetzung angesprochen, und oft haben wir gemeinsam in Erinnerungen ans Domnitzer Sommerquiz 2023 geschwelgt. Jetzt ist es so weit - und ich freu mich riesig darauf, mit euch wieder zu rätseln, zu lachen und gemeinsam einen wunderbaren Sommerabend zu verbringen. Habt ihr Lust? Dann sagt zu, bringt gute Laune mit und seid bereit für neue Fragen, neue Herausforderungen und denselben Geist wie beim letzten Mal!<br>Eurer Freund Rene";
        document.getElementById("password").scrollIntoView({ behavior: "smooth" });

    } else {
        const randomIndex = Math.floor(Math.random() * errorMessages.length);
        errorMessageElement.textContent = errorMessages[randomIndex];
        errorMessageElement.style.display = "block";
        errorMessageElement.style.color = "#ff6b6b";
        errorMessageElement.style.backgroundColor = "#ff6b6b1a";
    }
}

// Eventlistener für Button-Klick
document.getElementById("checkPasswordButton").addEventListener("click", function (e) {
    e.preventDefault();
    checkPassword();
});

// Eventlistener für Enter-Taste
document.querySelector("form").addEventListener("submit", function (e) {
    e.preventDefault();
    checkPassword();
});
