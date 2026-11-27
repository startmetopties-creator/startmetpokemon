-- Nieuwsbrief-inschrijvingen. Dit is onze eigen kopie van de lijst,
-- los van de mailtool (nu Resend). Wisselen van mailtool = deze tabel exporteren.
CREATE TABLE IF NOT EXISTS subscribers (
  email           TEXT PRIMARY KEY,               -- altijd lowercase
  status          TEXT NOT NULL DEFAULT 'active', -- active | unsubscribed | bounced
  bron            TEXT,                           -- pagina waar iemand zich aanmeldde
  subscribed_at   TEXT NOT NULL,                  -- ISO-datum van (her)aanmelding
  unsubscribed_at TEXT,
  source          TEXT NOT NULL DEFAULT 'site',   -- site | mailerlite
  welcome         TEXT,                           -- welke welkomstmail is verstuurd
  updated_at      TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_subscribers_status ON subscribers (status, unsubscribed_at);
