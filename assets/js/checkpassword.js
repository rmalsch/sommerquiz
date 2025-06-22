document.getElementById("checkPasswordButton").addEventListener("click", function () {
    const correctPassword = "geheim";
    const input = document.getElementById("passwordInput").value;
    const errorMessageElement = document.getElementById("errorMessage");

    const errorMessages = [
        "Falsches Passwort! Versuch es nochmal.",
        "Das war leider nichts...",
        "Nope, so einfach ist das nicht!",
        "Schon mal drüber nachgedacht, dass du falsch liegen könntest?",
        "Einmal tief durchatmen und nochmal probieren!"
    ];

    if (input === correctPassword) {
        // Inhalt verstecken
        // document.getElementById("password").style.display = "none";
        
        // Errormessage zeigen mit Gratulation o.Ä.
        errorMessageElement.textContent = "Wow! Du hast das fals.. äh, richtige Passwort eingegeben!";
        errorMessageElement.style.display = "block";
        errorMessageElement.style.color = "#77ff6b";
        errorMessageElement.style.backgroundColor = "#6bff891a";

        // Navigationseinträge nur "unsichtbar" machen
        document.querySelectorAll(".navHideOnUnlock").forEach(el => {
            el.style.visibility = "hidden";
        });
        // const navPassword = document.getElementById("navPassword");
        // navPassword.style.visibility = "hidden";
        // const navTipps = document.getElementById("navTipps");
        // navTipps.style.visibility = "hidden";

        // Geheimbereich anzeigen
        // Geheime Artikel sichtbar machen
        document.querySelectorAll(".geheimContent").forEach(el => {
            el.style.display = "block";
        });
        // Geheime Navigationseinträge sichtbar machen
        document.querySelectorAll(".geheimNav").forEach(el => {
            el.style.visibility = "visible";
        });
        // document.getElementById("geheim").style.display = "block";
        // document.getElementById("navGeheim").style.visibility = "visible";

        // Fehlermeldung ausblenden
        // errorMessageElement.style.display = "none";

        // Text auf Startseite ändern
        document.getElementById("headline").textContent = "Willkommen!";
        document.getElementById("introText").textContent = "Du hast das richtige Passwort eingegeben. Viel Spaß beim Erkunden!";
        
        // Seitengröße hat sich geändert, daher muss zu dem Inhalt gescrollt werden
        document.getElementById("password").scrollIntoView({ behavior: "smooth" });

    } else {
        const randomIndex = Math.floor(Math.random() * errorMessages.length);
        errorMessageElement.textContent = errorMessages[randomIndex];
        errorMessageElement.style.display = "block";
        errorMessageElement.style.color = "#ff6b6b";
        errorMessageElement.style.backgroundColor = "#ff6b6b1a";
    }
});
