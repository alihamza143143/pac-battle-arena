# PAC BATTLE ARENA

TikTok Live Pac-Man Arena Game — Multiplayer battle game with Blue vs Pink teams, real-time TikTok gift/like integration, and 15-minute rounds.

---

## Schnellstart (Quick Start)

### 1. Voraussetzungen (Requirements)

- **Node.js** v18 oder neuer — [Download](https://nodejs.org/)
- **OBS Studio** — [Download](https://obsproject.com/)
- Ein aktiver **TikTok Live Stream**

### 2. Installation

```bash
# Projekt-Ordner öffnen und Abhängigkeiten installieren
cd pac-battle-arena
npm install
```

### 3. Spiel starten

```bash
# Standard (dein TikTok Username ist bereits eingestellt)
npm start

# Oder mit eigenem TikTok Username
TIKTOK_USERNAME=playandwin2026 npm start
```

Das Spiel läuft auf: **http://localhost:3000**

### 4. In OBS einrichten

1. Öffne **OBS Studio**
2. Klicke auf **+** unter "Quellen" (Sources)
3. Wähle **Browser** (Browser Source)
4. Einstellungen:
   - **URL:** `http://localhost:3000`
   - **Breite:** `1080`
   - **Höhe:** `1080`
   - **Benutzerdefiniertes CSS:** leer lassen
5. Klicke **OK**
6. Positioniere die Quelle in deinem Stream-Layout

### 5. TikTok Live starten

1. Starte deinen TikTok Live Stream
2. Das Spiel verbindet sich automatisch
3. Zuschauer sehen das Spiel im Stream und können mitmachen

---

## Wie das Spiel funktioniert

### Spieler beitreten

| Aktion | Ergebnis |
|---|---|
| Zuschauer betritt den Live | Erscheint als **roter neutraler** Pac-Man ("Wähle ein Team") |
| Zuschauer sendet **Rose** (1 Coin) | Tritt **Team Pink** bei |
| Zuschauer sendet **TikTok-Geschenk** (1 Coin) | Tritt **Team Blue** bei |
| Zuschauer sendet **Like** | Pac-Man wird aktiviert (schwach) |

### Geschenk-System (Gifts)

| Geschenk | Coins | Farbe | Effekt | Dauer |
|---|---|---|---|---|
| 🌹 Rose | 1 | Pink | Aktivierung + minimaler Boost | 3 Sek |
| 🍩 Donut | 30 | Gelb | Schneller + 10 Pkt/Treffer | 3 Sek |
| 🎊 Confetti | 100 | Grün | Noch schneller + 20 Pkt/Treffer | 3 Sek |
| 💰 Money Gun | 500 | Orange | Alle einfrieren + 50 Pkt von jedem stehlen | 3 Sek |
| 🚒 Fire Truck | Ultimate | Rot | Explosion + riesig + 100 Pkt/Treffer gegen ALLE | 5 Sek |

### Kampf-System

- **Aktive** Spieler können **inaktive** Spieler angreifen
- Bei Kollision verliert der inaktive Spieler Punkte
- Stärkere Geschenke = mehr Schaden pro Treffer
- **Fire Truck** kann ALLE Spieler treffen (aktiv + inaktiv)
- **Money Gun** friert alle ein und stiehlt 50 Punkte von jedem

### Münzen (Coins)

- Leuchtende Münzen auf dem Spielfeld sammeln
- Nur **aktive Spieler mit Geschenk** können Münzen sammeln
- Reguläre Münze = +5 Punkte
- Große Münze = +15 Punkte
- Neue Münzen erscheinen alle 30 Sekunden

### Wachstum

- Mehr Punkte = größer
- Größer = schneller
- Größer = schnellere Mund-Animation
- ABER: Größer = leichteres Ziel (größere Hitbox)

### Runden

- Eine Runde dauert **15 Minuten**
- Am Ende: Gewinner-Team + Top 3 Spieler angezeigt
- Danach: Automatischer Reset, neue Runde beginnt

### König (King)

- Spieler mit den meisten Punkten bekommt eine **Krone** 👑
- Krone wechselt in Echtzeit

---

## Konfiguration

### TikTok Username ändern

```bash
# In der Kommandozeile
TIKTOK_USERNAME=dein_username npm start
```

### Port ändern

```bash
PORT=8080 npm start
```

Dann in OBS die URL zu `http://localhost:8080` ändern.

### Geschenk-Zuordnung anpassen

Die Zuordnung von TikTok-Geschenken zu Spiel-Aktionen kann in `server/tiktok/GiftMapper.js` angepasst werden:

```javascript
const GIFT_MAP = {
  'rose': 'rose',           // Rose → Pink Team + Aktivierung
  'donut': 'donut',         // Donut → Gelber Boost
  'confetti': 'confetti',   // Confetti → Grüner Boost
  'money gun': 'moneygun',  // Money Gun → Alle einfrieren
  'fire truck': 'firetruck',// Fire Truck → Ultimate
  'tiktok': 'tiktok',       // TikTok Logo → Blue Team
};
```

Falls ein Geschenk nicht erkannt wird, erscheint eine Meldung in der Server-Konsole mit dem Geschenk-Namen. Diesen dann in die Liste eintragen.

---

## Debug-Modus (zum Testen)

Öffne das Spiel im Browser und drücke **D** um das Debug-Panel zu öffnen.

Damit kannst du:
- Spieler manuell hinzufügen
- Teams beitreten
- Geschenke simulieren
- Chaos-Modus testen

**Wichtig:** Debug-Panel nur zum Testen verwenden, nicht im Live-Stream!

---

## Fehlerbehebung (Troubleshooting)

### "TikTok connection failed: The requested user isn't online"

Das ist normal wenn du noch nicht live bist. Das Spiel läuft im Offline-Modus weiter. Sobald du live gehst, verbindet es sich automatisch.

### Port bereits belegt

```bash
# Anderen Port verwenden
PORT=3001 npm start
```

### OBS zeigt schwarzen Bildschirm

1. Prüfe ob der Server läuft (`npm start`)
2. Prüfe die URL in OBS (http://localhost:3000)
3. Breite und Höhe müssen 1080x1080 sein
4. "Browser-Quelle neu laden" in OBS klicken

### Spiel läuft langsam

- Schließe andere Browser-Tabs
- OBS Hardware-Beschleunigung aktivieren
- Weniger Quellen im OBS-Layout

---

## Technische Details

| Komponente | Technologie |
|---|---|
| Frontend | PixiJS (WebGL) + Canvas 2D |
| Backend | Node.js + Express |
| Echtzeit | WebSocket (ws) |
| TikTok | tiktok-live-connector |
| Format | 1080x1080 (1:1 Quadrat) |
| Sprache | Deutsch |

### Projektstruktur

```
pac-battle-arena/
├── server/              # Spiel-Logik (30 FPS Game Loop)
│   ├── index.js         # Server-Start + WebSocket
│   ├── Game.js          # Haupt-Spielschleife
│   ├── PacMan.js        # Pac-Man Entity
│   ├── Arena.js         # Entity-Verwaltung + AI
│   ├── CombatSystem.js  # Kampf-System
│   ├── GiftSystem.js    # Geschenk-Effekte
│   ├── CoinSystem.js    # Münzen
│   ├── TeamManager.js   # Team-Verwaltung
│   ├── RoundManager.js  # Runden-Timer
│   ├── GrowthSystem.js  # Größen-/Geschwindigkeits-Berechnung
│   └── tiktok/          # TikTok Live Verbindung
├── client/              # Rendering (PixiJS + Canvas 2D)
│   ├── index.html       # Spiel-Seite
│   ├── app.js           # Haupt-App + Debug-Panel
│   ├── SoundManager.js  # Sound-Effekte
│   └── renderers/       # Visuelle Komponenten
├── tests/               # Jest Unit Tests (88 Tests)
└── package.json
```

---

## Support

Bei Fragen oder Problemen — einfach melden!
