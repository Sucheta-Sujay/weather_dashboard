"use strict";

const form = document.getElementById('searchForm');
const input = document.getElementById('cityInput');
const goBtn = document.getElementById('goBtn');
const suggestBox = document.getElementById('suggestions');
const statusEl = document.getElementById('status');
const dashEl = document.getElementById('dashboard');
const sky = document.getElementById('sky');
const skyBody = document.getElementById('skyBody');
const skyMeta = document.getElementById('skyMeta');
const skyParticles = document.getElementById('skyParticles');

const GEOCODE_URL = 'https://geocoding-api.open-meteo.com/v1/search';
const FORECAST_URL = 'https://api.open-meteo.com/v1/forecast';

// ---- WMO weather code -> description / icon family ----
const WEATHER_CODES = {
  0:  { text: 'Clear sky',            icon: 'sun' },
  1:  { text: 'Mainly clear',         icon: 'sun-cloud' },
  2:  { text: 'Partly cloudy',        icon: 'sun-cloud' },
  3:  { text: 'Overcast',             icon: 'cloud' },
  45: { text: 'Fog',                  icon: 'fog' },
  48: { text: 'Depositing rime fog',  icon: 'fog' },
  51: { text: 'Light drizzle',        icon: 'rain' },
  53: { text: 'Moderate drizzle',     icon: 'rain' },
  55: { text: 'Dense drizzle',        icon: 'rain' },
  56: { text: 'Light freezing drizzle', icon: 'rain' },
  57: { text: 'Dense freezing drizzle', icon: 'rain' },
  61: { text: 'Slight rain',          icon: 'rain' },
  63: { text: 'Moderate rain',        icon: 'rain' },
  65: { text: 'Heavy rain',           icon: 'rain' },
  66: { text: 'Light freezing rain',  icon: 'rain' },
  67: { text: 'Heavy freezing rain',  icon: 'rain' },
  71: { text: 'Slight snow fall',     icon: 'snow' },
  73: { text: 'Moderate snow fall',   icon: 'snow' },
  75: { text: 'Heavy snow fall',      icon: 'snow' },
  77: { text: 'Snow grains',          icon: 'snow' },
  80: { text: 'Slight rain showers',  icon: 'rain' },
  81: { text: 'Moderate rain showers', icon: 'rain' },
  82: { text: 'Violent rain showers', icon: 'rain' },
  85: { text: 'Slight snow showers',  icon: 'snow' },
  86: { text: 'Heavy snow showers',   icon: 'snow' },
  95: { text: 'Thunderstorm',         icon: 'storm' },
  96: { text: 'Thunderstorm, slight hail', icon: 'storm' },
  99: { text: 'Thunderstorm, heavy hail',  icon: 'storm' }
};

function weatherInfo(code){
  return WEATHER_CODES[code] || { text: 'Unknown', icon: 'cloud' };
}

// ---- Icon SVGs (self-contained, no external assets) ----
function iconSVG(kind, big){
  const stroke = big ? '4' : '3.5';
  const common = `fill="none" stroke="var(--paper)" stroke-width="${stroke}" stroke-linecap="round" stroke-linejoin="round"`;
  switch(kind){
    case 'sun':
      return `<svg viewBox="0 0 48 48" ${common}><circle cx="24" cy="24" r="10" fill="var(--amber)" stroke="none"/>
        <g stroke="var(--amber)">${[0,45,90,135,180,225,270,315].map(a=>`<line x1="24" y1="4" x2="24" y2="10" transform="rotate(${a} 24 24)"/>`).join('')}</g></svg>`;
    case 'sun-cloud':
      return `<svg viewBox="0 0 48 48" ${common}><circle cx="18" cy="16" r="7" fill="var(--amber)" stroke="none"/>
        <path d="M10 34a8 8 0 0 1 1-16 10 10 0 0 1 19-3 7 7 0 0 1 6 7 7 7 0 0 1-7 7H12a2 2 0 0 1-2-2z" fill="var(--mist)" stroke="none" opacity=".9"/></svg>`;
    case 'cloud':
      return `<svg viewBox="0 0 48 48" ${common}><path d="M12 34a8 8 0 0 1 1-16 10 10 0 0 1 19-3 7 7 0 0 1 6 7 7 7 0 0 1-7 7H14a2 2 0 0 1-2-2z" fill="var(--mist)" stroke="none"/></svg>`;
    case 'rain':
      return `<svg viewBox="0 0 48 48" ${common}><path d="M12 26a8 8 0 0 1 1-16 10 10 0 0 1 19-3 7 7 0 0 1 6 7 7 7 0 0 1-7 7H14a2 2 0 0 1-2-2z" fill="var(--mist)" stroke="none"/>
        <g stroke="var(--rain)">${[15,24,33].map(x=>`<line x1="${x}" y1="32" x2="${x-3}" y2="42"/>`).join('')}</g></svg>`;
    case 'snow':
      return `<svg viewBox="0 0 48 48" ${common}><path d="M12 26a8 8 0 0 1 1-16 10 10 0 0 1 19-3 7 7 0 0 1 6 7 7 7 0 0 1-7 7H14a2 2 0 0 1-2-2z" fill="var(--mist)" stroke="none"/>
        <g fill="#EAF2FA" stroke="none">${[15,24,33].map(x=>`<circle cx="${x}" cy="36" r="2"/>`).join('')}</g></svg>`;
    case 'storm':
      return `<svg viewBox="0 0 48 48" ${common}><path d="M12 24a8 8 0 0 1 1-16 10 10 0 0 1 19-3 7 7 0 0 1 6 7 7 7 0 0 1-7 7H14a2 2 0 0 1-2-2z" fill="var(--mist)" stroke="none"/>
        <path d="M24 28l-5 9h5l-3 7 9-11h-5l4-5z" fill="var(--amber)" stroke="none"/></svg>`;
    case 'fog':
      return `<svg viewBox="0 0 48 48" ${common}><g stroke="var(--mist)">${[16,24,32].map(y=>`<line x1="8" y1="${y}" x2="40" y2="${y}"/>`).join('')}</g></svg>`;
    default:
      return `<svg viewBox="0 0 48 48" ${common}><circle cx="24" cy="24" r="10"/></svg>`;
  }
}

function moonSVG(){
  return `<svg viewBox="0 0 48 48" fill="none"><path d="M30 8a16 16 0 1 0 10 28 12 12 0 0 1-10-28z" fill="#DCE3EC"/></svg>`;
}

// ---- Sky strip animation ----
function renderSky(current, isDay){
  skyParticles.innerHTML = '';
  const pct = Math.min(96, Math.max(4, ((current.hour % 24) / 24) * 100));
  skyBody.style.left = pct + '%';
  if(isDay){
    skyBody.style.background = 'radial-gradient(circle at 35% 35%, #FFDFA0, var(--amber))';
    skyBody.style.boxShadow = '0 0 18px 4px rgba(232,163,61,0.55)';
    skyBody.innerHTML = '';
  } else {
    skyBody.style.background = 'transparent';
    skyBody.style.boxShadow = 'none';
    skyBody.innerHTML = moonSVG();
  }
  skyMeta.innerHTML = `<strong>${current.label}</strong> · local time ${current.timeStr}`;

  if(current.icon === 'rain'){
    for(let i=0;i<14;i++){
      const d = document.createElement('div');
      d.className = 'drop';
      d.style.left = (Math.random()*100)+'%';
      d.style.animationDuration = (0.6 + Math.random()*0.6)+'s';
      d.style.animationDelay = (Math.random()*1)+'s';
      skyParticles.appendChild(d);
    }
  } else if(current.icon === 'snow'){
    for(let i=0;i<14;i++){
      const f = document.createElement('div');
      f.className = 'flake';
      f.style.left = (Math.random()*100)+'%';
      f.style.animationDuration = (1.6 + Math.random()*1.2)+'s';
      f.style.animationDelay = (Math.random()*1.4)+'s';
      skyParticles.appendChild(f);
    }
  }
}

// ---- Status / error helpers ----
function showStatus(html, isErr){
  statusEl.innerHTML = html;
  statusEl.className = 'show' + (isErr ? ' err' : '');
  dashEl.classList.remove('show');
}
function clearStatus(){
  statusEl.className = '';
  statusEl.innerHTML = '';
}
function setLoading(msg){
  showStatus(`<span class="pulse"></span>${msg}`, false);
}

// ---- Core async flow ----
async function geocodeCity(name){
  const url = `${GEOCODE_URL}?name=${encodeURIComponent(name)}&count=5&language=en&format=json`;
  let res;
  try{
    res = await fetch(url);
  } catch(networkErr){
    throw new Error('NETWORK: Could not reach the geocoding service. Check your connection and try again.');
  }
  if(!res.ok){
    throw new Error(`GEOCODE_HTTP: Geocoding service returned status ${res.status}.`);
  }
  let data;
  try{
    data = await res.json();
  } catch(parseErr){
    throw new Error('PARSE: Received a malformed response from the geocoding service.');
  }
  if(!data.results || data.results.length === 0){
    throw new Error(`NOT_FOUND: No location found for "${name}". Try a different spelling or add a country, e.g. "Springfield, US".`);
  }
  return data.results;
}

async function fetchWeather(lat, lon){
  const params = new URLSearchParams({
    latitude: lat,
    longitude: lon,
    current: 'temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m,wind_direction_10m,is_day,surface_pressure',
    hourly: 'temperature_2m,weather_code,precipitation_probability',
    daily: 'sunrise,sunset,temperature_2m_max,temperature_2m_min',
    timezone: 'auto',
    forecast_days: '2'
  });
  const url = `${FORECAST_URL}?${params.toString()}`;
  let res;
  try{
    res = await fetch(url);
  } catch(networkErr){
    throw new Error('NETWORK: Could not reach the forecast service. Check your connection and try again.');
  }
  if(!res.ok){
    throw new Error(`FORECAST_HTTP: Forecast service returned status ${res.status}.`);
  }
  let data;
  try{
    data = await res.json();
  } catch(parseErr){
    throw new Error('PARSE: Received a malformed response from the forecast service.');
  }
  if(!data.current){
    throw new Error('SHAPE: Forecast response was missing current-conditions data.');
  }
  return data;
}

function windDirLabel(deg){
  const dirs = ['N','NNE','NE','ENE','E','ESE','SE','SSE','S','SSW','SW','WSW','W','WNW','NW','NNW'];
  return dirs[Math.round(deg / 22.5) % 16];
}

function renderDashboard(place, weather){
  const cur = weather.current;
  const units = weather.current_units || {};
  const info = weatherInfo(cur.weather_code);
  const isDay = cur.is_day === 1;

  document.getElementById('placeName').innerHTML =
    `${place.name}<small>${[place.admin1, place.country].filter(Boolean).join(', ')} · ${place.latitude.toFixed(2)}, ${place.longitude.toFixed(2)}</small>`;

  document.getElementById('tempValue').innerHTML = `${Math.round(cur.temperature_2m)}<sup>${units.temperature_2m || '°C'}</sup>`;
  document.getElementById('condText').textContent = info.text;
  document.getElementById('feelsText').textContent = `Feels like ${Math.round(cur.apparent_temperature)}${units.apparent_temperature || '°C'}`;

  document.getElementById('heroIconWrap').innerHTML = iconSVG(isDay ? info.icon : (info.icon === 'sun' ? 'cloud' : info.icon), true);

  const daily = weather.daily || {};
  const sunrise = daily.sunrise ? daily.sunrise[0].split('T')[1] : '—';
  const sunset = daily.sunset ? daily.sunset[0].split('T')[1] : '—';
  const tMax = daily.temperature_2m_max ? Math.round(daily.temperature_2m_max[0]) : '—';
  const tMin = daily.temperature_2m_min ? Math.round(daily.temperature_2m_min[0]) : '—';

  const metrics = [
    { label: 'Humidity', value: cur.relative_humidity_2m, unit: units.relative_humidity_2m || '%', sub: 'relative' },
    { label: 'Wind speed', value: Math.round(cur.wind_speed_10m), unit: units.wind_speed_10m || 'km/h', sub: `from ${windDirLabel(cur.wind_direction_10m)}` },
    { label: 'Pressure', value: Math.round(cur.surface_pressure), unit: units.surface_pressure || 'hPa', sub: 'surface' },
    { label: 'Precipitation', value: cur.precipitation, unit: units.precipitation || 'mm', sub: 'last hour' },
    { label: "Today's range", value: `${tMin}° / ${tMax}°`, unit: '', sub: 'low / high' },
    { label: 'Sunrise', value: sunrise, unit: '', sub: 'local time' },
    { label: 'Sunset', value: sunset, unit: '', sub: 'local time' },
    { label: 'Condition code', value: cur.weather_code, unit: 'WMO', sub: info.text }
  ];
  document.getElementById('metrics').innerHTML = metrics.map(m => `
    <div class="metric">
      <div class="label">${m.label}</div>
      <div class="value">${m.value}${m.unit ? `<span> ${m.unit}</span>` : ''}</div>
      <div class="sub">${m.sub}</div>
    </div>
  `).join('');

  // Hourly strip: next 12 hours starting from current hour
  const hourly = weather.hourly || {};
  const nowISO = cur.time;
  let startIdx = hourly.time ? hourly.time.findIndex(t => t === nowISO) : -1;
  if(startIdx === -1) startIdx = 0;
  const slice = [];
  for(let i = startIdx; i < Math.min(startIdx + 12, (hourly.time || []).length); i++){
    slice.push({
      time: hourly.time[i],
      temp: hourly.temperature_2m[i],
      code: hourly.weather_code[i]
    });
  }
  document.getElementById('hourlyRow').innerHTML = slice.map((h, i) => {
    const hInfo = weatherInfo(h.code);
    const hh = h.time.split('T')[1].slice(0,5);
    return `<div class="hour ${i===0 ? 'now' : ''}">
      <div class="t">${i===0 ? 'NOW' : hh}</div>
      ${iconSVG(hInfo.icon, false)}
      <div class="v">${Math.round(h.temp)}°</div>
    </div>`;
  }).join('');

  // sky strip
  const nowHour = new Date(cur.time).getHours();
  renderSky({
    hour: nowHour,
    label: info.text,
    timeStr: cur.time.split('T')[1],
    icon: info.icon
  }, isDay);

  clearStatus();
  dashEl.classList.add('show');
}

async function runSearch(cityName, forcedResult){
  if(!cityName || !cityName.trim()){
    showStatus('Type a city name to begin — e.g. "Mysuru" or "Paris".', true);
    return;
  }
  goBtn.disabled = true;
  suggestBox.style.display = 'none';
  try{
    setLoading(`Locating "${cityName}"…`);
    let place = forcedResult;
    if(!place){
      const results = await geocodeCity(cityName.trim());
      if(results.length > 1 && !forcedResult){
        // Offer disambiguation instead of guessing silently
        suggestBox.innerHTML = results.map((r, i) => `
          <button type="button" data-idx="${i}">
            ${r.name}
            <small>${[r.admin1, r.country].filter(Boolean).join(', ')}</small>
          </button>
        `).join('');
        suggestBox.style.display = 'block';
        suggestBox.querySelectorAll('button').forEach((btn, i) => {
          btn.addEventListener('click', () => runSearch(cityName, results[i]));
        });
        clearStatus();
        goBtn.disabled = false;
        return;
      }
      place = results[0];
    }
    setLoading(`Fetching live conditions for ${place.name}…`);
    const weather = await fetchWeather(place.latitude, place.longitude);
    renderDashboard(place, weather);
  } catch(err){
    const msg = err && err.message ? err.message : 'Unknown error.';
    showStatus(`⚠ ${msg.replace(/^[A-Z_]+:\s*/, '')}`, true);
    console.error('Weather dashboard error:', err);
  } finally{
    goBtn.disabled = false;
  }
}

form.addEventListener('submit', function(e){
  e.preventDefault();
  runSearch(input.value);
});

document.addEventListener('click', function(e){
  if(!form.contains(e.target)) suggestBox.style.display = 'none';
});

// Boot with a sensible default so the dashboard isn't empty on load
input.value = 'Mysuru';
runSearch('Mysuru');