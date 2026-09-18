// Builds src/data/airports.json from OurAirports' airports.csv (public domain,
// https://ourairports.com/data/): every airport with scheduled passenger flights
// and an IATA code, as [code, city, airport, country, rank].
//
// Usage: download https://davidmegginson.github.io/ourairports-data/airports.csv,
// then: node scripts/build-airports.cjs path/to/airports.csv src/data/airports.json
const fs = require('fs');

const [, , csvPath, outPath] = process.argv;
const text = fs.readFileSync(csvPath, 'utf8');

// RFC 4180-ish: quoted fields may hold commas and doubled quotes.
function parseCsv(input) {
  const rows = [];
  let row = [];
  let field = '';
  let quoted = false;
  for (let i = 0; i < input.length; i++) {
    const ch = input[i];
    if (quoted) {
      if (ch === '"') {
        if (input[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          quoted = false;
        }
      } else {
        field += ch;
      }
    } else if (ch === '"') {
      quoted = true;
    } else if (ch === ',') {
      row.push(field);
      field = '';
    } else if (ch === '\n') {
      row.push(field);
      rows.push(row);
      row = [];
      field = '';
    } else if (ch !== '\r') {
      field += ch;
    }
  }
  if (field || row.length) {
    row.push(field);
    rows.push(row);
  }
  return rows;
}

const [header, ...rows] = parseCsv(text);
const col = Object.fromEntries(header.map((name, index) => [name, index]));
const RANK = { large_airport: 0, medium_airport: 1, small_airport: 2 };

const seen = new Set();
const airports = [];
for (const row of rows) {
  const type = row[col.type];
  const code = row[col.iata_code];
  if (!(type in RANK) || row[col.scheduled_service] !== 'yes' || !/^[A-Z]{3}$/.test(code ?? '')) continue;
  if (seen.has(code)) continue;
  seen.add(code);
  const city = (row[col.municipality] || row[col.name]).trim();
  airports.push([code, city, row[col.name].trim(), row[col.iso_country], RANK[type]]);
}

airports.sort((a, b) => a[4] - b[4] || a[1].localeCompare(b[1]));
fs.writeFileSync(outPath, JSON.stringify(airports));
const counts = [0, 1, 2].map((rank) => airports.filter((a) => a[4] === rank).length);
console.log(`${airports.length} airports (large ${counts[0]}, medium ${counts[1]}, small ${counts[2]}), ${fs.statSync(outPath).size} bytes`);
for (const code of ['NBO', 'MBA', 'MGQ', 'HGA', 'BSA', 'GLK', 'KMU', 'BBO', 'GGR', 'JED', 'MED', 'DXB', 'FRA', 'LHR', 'JFK', 'KIS', 'EDL', 'ADD']) {
  const hit = airports.find((a) => a[0] === code);
  console.log(code, hit ? `${hit[1]} — ${hit[2]} (${hit[3]}, rank ${hit[4]})` : 'MISSING');
}
