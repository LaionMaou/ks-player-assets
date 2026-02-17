/* ===== CONFIG ===== */

const STREAM_URL = "https://stream.zeno.fm/f44npslgxjyuv";
const SSE_URL = "https://api.zeno.fm/mounts/metadata/subscribe/f44npslgxjyuv";
const LASTFM_KEY = "f0b583433bf0fba04aa60da6f649f479";
const FALLBACK = "https://i.postimg.cc/76P7vwVG/ks-logo.png";

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
      iconPlay.style.display="none";
      iconStop.style.display="block";
      cover.classList.add("playing");
    }).catch(()=>{});
  }else{
    audio.pause();
    iconPlay.style.display="block";
    iconStop.style.display="none";
    cover.classList.remove("playing");
  }
}

/* ===== METADATA ===== */

function handleMeta(title){
  if(!title) return;

  let artist="", song=title;

  if(title.includes(" - ")){
    const p = title.split(" - ");
    artist = p[0].trim();
    song = p.slice(1).join(" - ").trim();
  }

  titleEl.innerText = song;
  artistEl.innerText = artist;

  loadCover(artist,song);
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
  },10000);
}

/* ===== LASTFM COVER ===== */

async function loadCover(artist,title){
  if(!artist || !title){
    cover.src = FALLBACK;
    return;
  }

  try{
    const url =
      "https://ws.audioscrobbler.com/2.0/?method=track.getInfo"+
      "&api_key="+LASTFM_KEY+
      "&artist="+encodeURIComponent(artist)+
      "&track="+encodeURIComponent(title)+
      "&format=json";

    const r = await fetch(url);
    const j = await r.json();

    if(j.track?.album?.image){
      const img = j.track.album.image.pop()["#text"];
      if(img){
        cover.src = img;
        return;
      }
    }
  }catch(e){}

  cover.src = FALLBACK;
}
