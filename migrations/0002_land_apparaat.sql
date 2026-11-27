-- Grove herkomst van nieuwe aanmeldingen voor het dashboard (sinds 27 nov 2026).
-- land: tweeletterige landcode volgens Cloudflare (geen IP-adres opgeslagen).
-- apparaat: mobiel | tablet | desktop (afgeleid uit de browser, user-agent zelf niet opgeslagen).
ALTER TABLE subscribers ADD COLUMN land TEXT;
ALTER TABLE subscribers ADD COLUMN apparaat TEXT;
