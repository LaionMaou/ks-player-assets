/* ===== CONFIG ===== */

const STREAM_URL = "https://stream.host-cx.net.ar/listen/konata-station-radio/tunein.mp3";
const SSE_URL = "https://api.zeno.fm/mounts/metadata/subscribe/f44npslgxjyuv";
const FALLBACK = "https://i.postimg.cc/76P7vwVG/ks-logo.png";
const LASTFM_PROXY = "https://artx.com.ar/extras/relay/v3/api/lastfm.php";

/* ===== ELEMENTS ===== */

const audio = document.getElementById("audio");
const cover = document.getElementById("cover");
const titleEl = document.getElementById("title");
const artistEl = document.getElementById("artist");
const iconPlay = document.getElementById("iconPlay");
const iconStop = document.getElementById("iconStop");
const btn = document.getElementById("btn");

audio.src = STREAM_URL;

/* ===== PLAY CONTROL ===== */

btn.addEventListener("click", togglePlay);

function togglePlay(){
  if(audio.paused){
    audio.play().then(()=>{
      iconPlay.style.display = "none";
      iconStop.style.display = "block";
      cover.classList.add("playing");
    }).catch(()=>{});
  }else{
    audio.pause();
    iconPlay.style.display = "block";
    iconStop.style.display = "none";
    cover.classList.remove("playing");
  }
}

/* ===== METADATA ===== */

function handleMeta(title){
  if(!title) return;

  let artist = "";
  let song = title;

  if(title.includes(" - ")){
    const p = title.split(" - ");
    artist = p[0].trim();
    song = p.slice(1).join(" - ").trim();
  }

  titleEl.innerText = song;
  artistEl.innerText = artist;

  loadCover(artist, song);
}

/* ===== SSE ===== */

function connectSSE(){
  const ev = new EventSource(SSE_URL);

  ev.onmessage = (msg)=>{
    try{
      const d = JSON.parse(msg.data);
      if(d.streamTitle) handleMeta(d.streamTitle);
      if(d.title) handleMeta(d.title);
    }catch(e){}
  };

  ev.onerror = ()=>{
    ev.close();
    startPolling();
  };
}

connectSSE();

/* ===== POLLING FALLBACK ===== */

function startPolling(){
  setInterval(async ()=>{
    try{
      const r = await fetch("https://api.zeno.fm/stations/f44npslgxjyuv");
      const j = await r.json();
      if(j.now_playing?.song){
        handleMeta(j.now_playing.song);
      }
    }catch(e){}
  }, 10000);
}

/* ===== COVER VIA BACKEND (NO API KEY) ===== */

async function loadCover(artist, title){

  if(!artist || !title){
    cover.src = FALLBACK;
    return;
  }

  try{
    const url =
      LASTFM_PROXY +
      "?artist=" + encodeURIComponent(artist) +
      "&track="  + encodeURIComponent(title);

    const r = await fetch(url);
    const j = await r.json();

    if(j.image){
      cover.src = j.image;
      return;
    }
  }catch(e){}

  cover.src = FALLBACK;
}
