// Zentrale Textquelle für globale Website-Texte wie Unterzeile, Intro und Footer.
window.SiteConfig = {
  siteName: "Sommerquiz",
  siteTagline: "Website",
  eventDate: "2026-08-01T16:00:00+02:00",
  eventAdmissionDate: "2026-08-01T15:00:00+02:00",
  eventLocation: "Hallesche Str. 777, 06198 Wettin-Löbejün",
  accessPassword: "quizday",
  accessStorageKey: "sq_access_granted",
  riddleProgressStorageKey: "sq_riddle_progress_v1",
  introText: "Kaum zu glauben, aber wahr: Das Sommerquiz geht tatsächlich schon in die dritte Runde — das klingt langsam verdächtig nach Tradition! Und da wir diese Entwicklung nun natürlich nicht einfach abbrechen können, lade ich Euch auch dieses Jahr wieder herzlich ein.",
  accessGrantedLabel: "Freigeschaltet",
  accessNextSteps: {
    title: "Was jetzt wichtig ist",
    intro: "Nach der Freischaltung warten nicht nur neue Seiten, sondern auch ein paar Dinge, bei denen deine Rückmeldung gefragt ist:",
    compactText: "Wenn du kommen möchtest, beginne bitte mit der Zusage. Danach kannst du direkt die wichtigsten Mitmach-Bereiche erkunden:",
    compactItems: [
      { href: "rsvp.html", label: "Zusage", important: true },
      { href: "bring.html", label: "Mitbringen" },
      { href: "teams.html", label: "Sommerquiz-Profil" }
    ],
    items: [
      { href: "rsvp.html", label: "Zusage", text: "Wenn du beim Sommerquiz dabei sein möchtest, trage dich bitte zuerst hier ein.", important: true },
      { href: "teams.html", label: "Sommerquiz-Profil", text: "Fülle dein Sommerquiz-Profil aus. Das ist bestimmt für nichts Wichtiges relevant und wird ganz sicher nicht später in irgendeine mysteriöse Teamlogik einfließen." , important: true },
      { href: "bring.html", label: "Mitbringen", text: "Wirf einen Blick auf das bisher geplante Buffet und trage, wenn du möchtest, etwas dazu bei." },
      { href: "games.html", label: "Themen & Spiele", text: "Reiche Spielideen, Themenwünsche oder eigene Beiträge ein." },
      { href: "news.html", label: "News", text: "Lies Neuigkeiten oder melde dich zum Newsletter an." },
      { href: "faq.html", label: "FAQ", text: "Finde Antworten auf organisatorische Fragen oder stelle selbst eine." }
    ]
  },
  wrongPasswordMessages: [
    "Das war wohl nix.",
    "Huch? Das Passwort ist leider falsch.",
    "Falsches Passwort. Aber hey, Du hast immerhin den Mut, es zu versuchen.",
    "Hast Du dich vertippt? Oder war das etwa Absicht?",
    "Hast Du einen schlechten Tag? Das Passwort ist leider falsch.",
    "Du bist hartnäckig. Aber leider auch erfolglos. Das Passwort ist falsch.",
    "Ich bin verwundert. Wieso probierst du es überhaupt noch?",
    "Was reimt sich auf MALSCH? Das eingegebene Passwort ist ...",
  ],
  publicNav: [
    { href: "index.html", label: "Start" }
  ],
  protectedNav: [
    { href: "news.html", label: "News" },
    { href: "blog.html", label: "Blog" },
    { href: "gallery.html", label: "Chronik" },
    { href: "rsvp.html", label: "Zusage" },
    { href: "bring.html", label: "Mitbringen" },
    { href: "games.html", label: "Themen & Spiele" },
    { href: "teams.html", label: "Sommerquiz-Profil" },
    { href: "faq.html", label: "FAQ" }
  ],
  socialHint: "Gut geraten ist halb gewusst.",
};
