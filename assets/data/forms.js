window.FormConfig = {
  // Google-Apps-Script-/exec-URL für Formularübertragung und Live-Daten.
  endpoint: "https://script.google.com/macros/s/AKfycbwUknqYxNCP4SsW-Phhw5MLn_PQsmOce_iHBeF34IwYywNFVSXN5KdstVwHylmBDvU/exec",

  modes: {
    rsvp: "remote",
    bring: "remote",
    games: "remote",
    newsletter: "remote",
    teams: "remote",
    faq: "remote",
    pickup: "remote"
  },

  remoteFormTypes: {
    rsvp: "rsvp",
    bring: "bring",
    games: "games",
    newsletter: "newsletter",
    teams: "team_profiles",
    faq: "faq_questions",
    pickup: "pickup_requests"
  },

  messages: {
    success: "Danke! Deine Eingabe wurde verarbeitet.",
    error: "Das Absenden hat gerade nicht funktioniert.",
    remoteMissing: "Dieses Formular ist gerade nicht erreichbar. Versuch es bitte gleich noch einmal.",
    sending: "Der Quizbote sprintet los ...",
    remoteTimeout: "Gerade kam keine Rückmeldung. Versuch es bitte noch einmal.",
    remoteError: "Das Senden an den externen Dienst hat gerade nicht funktioniert.",
    remoteInvalidResponse: "Die Anfrage wurde gesendet, aber die Antwort vom externen Dienst sah merkwürdig aus.",
    byKind: {
      rsvp: "Deine Zusage ist notiert — der Quizmaster freut sich.",
      bring: "Eingetragen! Das Sommerquiz-Buffet nimmt Form an.",
      games: "Dein Beitrag ist notiert. Mal sehen, was daraus wird ...",
      newsletter: "Du bist jetzt auf der Update-Liste gelandet.",
      teams: "Danke! Dein Sommerquiz-Profil wurde gespeichert. Der Quizmaster wird die Teams daraus vollkommen subjektiv und keinesfalls zufällig zusammenstellen.",
      faq: "Danke! Deine Frage ist angekommen und wird vom Quizmaster fachkundig beäugt.",
      pickup: "Danke! Der Quizmaster wird sich bei dir melden."
    },
    errorByKind: {
      default: "Ups — da ist etwas schiefgelaufen. Vielleicht sabotiert die Sommersonne gerade die Technik.",
      teamsMissingChoice: "Bitte beantworte alle Fragen."
    }
  }
};
