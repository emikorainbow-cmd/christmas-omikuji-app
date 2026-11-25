/* =====================================================================
   世界のクリスマス旅おみくじ ― 動きのしくみ（app.js）
   ・舞台（縦長の絵）の大きさ合わせ、光と雪の演出
   ・オルゴールの音（WebAudio で合成。音のファイルは使いません）
   ・箱が開く演出 → 結果のカード → スタンプ帳 → 世界一周のお祝い
   ・「友だちに贈る」（文章コピー）と「カードを保存する」（画像）
   文章やデータを直したいときは data.js を書きかえてください。
   ===================================================================== */
(function () {
  "use strict";

  const D = window.XMAS_DATA;
  const A = window.XMAS_ART;
  const $ = (id) => document.getElementById(id);
  const app = $("app");
  const SVGNS = "http://www.w3.org/2000/svg";
  const IMG_W = 941, IMG_H = 1672;

  /* ---------------------------------------------------------------
     保存（ブラウザの中。使えなくてもアプリは動きます）
     --------------------------------------------------------------- */
  const STORE_KEY = "xmasTabiOmikuji.v2";
  const PREF_KEY = "xmasTabiOmikuji.prefs";
  const OLD_KEY = "xmasTabiOmikuji.stamps";
  const readJSON = (k) => { try { return JSON.parse(localStorage.getItem(k) || "null"); } catch (e) { return null; } };
  const writeJSON = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* 保存できなくても続けられます */ } };

  const validIds = new Set(D.countries.map((c) => c.id));
  /* goldenDrawn：黄金のおみくじを引いた／secretRevealed：ひみつの14番目が開いた／goldenMsg：そのとき届いたひとこと */
  const store = { stamps: [], celebrated: false, lastCountry: "", lastMsg: -1, lastLucky: -1, goldenDrawn: false, secretRevealed: false, goldenMsg: -1 };
  (() => {
    const s = readJSON(STORE_KEY);
    if (s && typeof s === "object") {
      if (Array.isArray(s.stamps)) store.stamps = s.stamps.filter((id) => validIds.has(id));
      store.celebrated = !!s.celebrated;
      if (typeof s.lastCountry === "string") store.lastCountry = s.lastCountry;
      if (Number.isInteger(s.lastMsg)) store.lastMsg = s.lastMsg;
      if (Number.isInteger(s.lastLucky)) store.lastLucky = s.lastLucky;
      store.goldenDrawn = !!s.goldenDrawn;
      store.secretRevealed = !!s.secretRevealed || store.goldenDrawn;
      if (Number.isInteger(s.goldenMsg)) store.goldenMsg = s.goldenMsg;
    } else {
      /* 前のバージョンのスタンプ（国の番号）を引き継ぐ */
      const old = readJSON(OLD_KEY);
      if (Array.isArray(old)) old.forEach((i) => { if (Number.isInteger(i) && D.countries[i]) store.stamps.push(D.countries[i].id); });
    }
    store.stamps = [...new Set(store.stamps)];
  })();
  const stamps = new Set(store.stamps);
  const saveStore = () => { store.stamps = [...stamps]; writeJSON(STORE_KEY, store); };

  const prefs = Object.assign({ sound: true, calm: false }, readJSON(PREF_KEY) || {});
  const mq = window.matchMedia ? window.matchMedia("(prefers-reduced-motion: reduce)") : { matches: false };
  const isCalm = () => !!prefs.calm || mq.matches;

  /* ---------------------------------------------------------------
     舞台の大きさ（絵の比率 941:1672 はそのまま）
     スマホの縦長画面では、左右をほんの少しだけはみ出させて画面いっぱいに近づけます
     --------------------------------------------------------------- */
  const S = { sx: 0, sy: 0, sw: 0, sh: 0, k: 1, vw: 0, vh: 0 };
  const layout = () => {
    const vw = window.innerWidth, vh = window.innerHeight;
    const contain = Math.min(vw / IMG_W, vh / IMG_H);
    const cover = Math.max(vw / IMG_W, vh / IMG_H);
    let k = contain;
    if (vw / vh < 0.75) k = Math.min(cover, contain * 1.1);
    const sw = IMG_W * k, sh = IMG_H * k;
    const sx = (vw - sw) / 2, sy = (vh - sh) / 2;
    Object.assign(S, { sx, sy, sw, sh, k, vw, vh });
    const vx = Math.max(0, sx), vy = Math.max(0, sy);
    const r = document.documentElement.style;
    r.setProperty("--sx", sx + "px"); r.setProperty("--sy", sy + "px");
    r.setProperty("--sw", sw + "px"); r.setProperty("--sh", sh + "px");
    r.setProperty("--vx", vx + "px"); r.setProperty("--vy", vy + "px");
    r.setProperty("--vw", (Math.min(vw, sx + sw) - vx) + "px");
    r.setProperty("--vh", (Math.min(vh, sy + sh) - vy) + "px");
    FX.resize();
  };

  /* ---------------------------------------------------------------
     絵に重ねる光（位置は絵の上のピクセル座標）
     --------------------------------------------------------------- */
  const svgEl = (tag, attrs) => { const e = document.createElementNS(SVGNS, tag); Object.keys(attrs).forEach((k) => e.setAttribute(k, attrs[k])); return e; };
  const buildLights = () => {
    const tree = [[98, 368, 46], [193, 830], [168, 707], [104, 792], [279, 872], [217, 655], [100, 440], [218, 717], [38, 636], [160, 552],
      [141, 789], [113, 929], [70, 947], [67, 703], [26, 547], [57, 835], [167, 1012], [60, 480], [150, 470], [200, 600], [250, 700], [120, 640],
      [30, 760], [210, 900], [90, 1050], [40, 1150], [135, 600], [260, 800]];
    const g = $("treeLights");
    tree.forEach(([x, y, r], i) => {
      const c = svgEl("circle", { cx: x, cy: y, r: r || 15 + (i % 3) * 4, fill: "url(#tw)", class: "tw" });
      c.style.setProperty("--d", (2.2 + ((i * 0.37) % 2.8)).toFixed(2) + "s");
      c.style.setProperty("--dl", (-((i * 0.71) % 3.2)).toFixed(2) + "s");
      g.appendChild(c);
    });
    const lamps = [[812, 620, 60], [818, 797, 36], [905, 790, 52], [886, 870, 30], [930, 530, 26], [105, 1468, 86],
      [614, 796, 16], [699, 799, 16], [691, 839, 14], [588, 786, 14], [662, 610, 20], [770, 860, 18]];
    const lg = $("lamps");
    lamps.forEach(([x, y, r], i) => {
      const c = svgEl("circle", { cx: x, cy: y, r, fill: "url(#warm)", class: "lamp" });
      c.style.setProperty("--d", (3.4 + (i % 4) * 0.9).toFixed(2) + "s");
      c.style.setProperty("--dl", (-(i * 1.3)).toFixed(2) + "s");
      lg.appendChild(c);
    });
    const glints = [[420, 250, 16], [600, 330, 12], [250, 300, 14], [880, 250, 12], [680, 60, 14], [530, 150, 18], [330, 430, 10], [760, 420, 12], [890, 40, 10]];
    const gg = $("glints");
    glints.forEach(([x, y, s], i) => {
      const d = `M${x} ${y - s}Q${x + s * .15} ${y - s * .15} ${x + s} ${y}Q${x + s * .15} ${y + s * .15} ${x} ${y + s}Q${x - s * .15} ${y + s * .15} ${x - s} ${y}Q${x - s * .15} ${y - s * .15} ${x} ${y - s}Z`;
      const p = svgEl("path", { d, fill: "#fffbe6", class: "glint" });
      p.style.setProperty("--d", (9 + (i * 1.7) % 7).toFixed(1) + "s");
      p.style.setProperty("--dl", (-(i * 2.3) % 9).toFixed(1) + "s");
      gg.appendChild(p);
    });
    /* 黄金の箱のまわりで、ゆっくりまたたく金の光 */
    const sparks = [[205, 925, 26], [760, 955, 22], [140, 1170, 18], [800, 1190, 20], [330, 850, 16], [650, 860, 18], [480, 790, 22], [560, 1330, 14], [300, 1350, 13]];
    const sg = $("goldenSparks");
    sparks.forEach(([x, y, s2], i) => {
      const d = `M${x} ${y - s2}Q${x + s2 * .15} ${y - s2 * .15} ${x + s2} ${y}Q${x + s2 * .15} ${y + s2 * .15} ${x} ${y + s2}Q${x - s2 * .15} ${y + s2 * .15} ${x - s2} ${y}Q${x - s2 * .15} ${y - s2 * .15} ${x} ${y - s2}Z`;
      const p = svgEl("path", { d, fill: "#fff3c4", class: "ga-spark" });
      p.style.setProperty("--d", (4.5 + (i * 0.9) % 3).toFixed(1) + "s");
      p.style.setProperty("--dl", (-(i * 1.1) % 4).toFixed(1) + "s");
      sg.appendChild(p);
    });
  };

  /* ---------------------------------------------------------------
     雪と光の粒（キャンバス）
     --------------------------------------------------------------- */
  const FX = (() => {
    const cv = $("fx"), ctx = cv.getContext("2d");
    let W = 0, H = 0, dpr = 1, flakes = [], motes = [], mode = "idle", running = false, lastT = 0, modeT = 0, fade = 1;
    let starOn = false, boost = 1; /* 世界一周のあと：雪の一部を小さな星に／黄金の箱：光の粒を少し多めに */
    const mkSprite = (inner, mid) => {
      const c = document.createElement("canvas"); c.width = c.height = 64;
      const x = c.getContext("2d"), g = x.createRadialGradient(32, 32, 0, 32, 32, 32);
      g.addColorStop(0, inner); g.addColorStop(0.25, mid); g.addColorStop(1, "rgba(255,200,90,0)");
      x.fillStyle = g; x.fillRect(0, 0, 64, 64); return c;
    };
    const gold = mkSprite("rgba(255,252,230,1)", "rgba(255,214,120,.65)");
    const white = mkSprite("rgba(255,255,255,.95)", "rgba(255,255,255,.55)");
    const LAYERS = [[0.5, 0.5, 1.1, 0.16, 0.32, 0.45], [0.35, 1.1, 1.9, 0.38, 0.66, 0.72], [0.15, 2.0, 3.3, 0.78, 1.15, 0.9]];
    const mkFlake = (L, anywhere) => {
      const l = LAYERS[L];
      return { L, x: Math.random() * W, y: anywhere ? Math.random() * H : -6, r: l[1] + Math.random() * (l[2] - l[1]),
        vy: l[3] + Math.random() * (l[4] - l[3]), a: l[5] * (0.7 + Math.random() * 0.3), ph: Math.random() * 6.28, sw: 0.25 + Math.random() * 0.6,
        star: L > 0 && Math.random() < 0.14 };
    };
    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      W = window.innerWidth; H = window.innerHeight;
      cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const n = Math.round(Math.min(220, Math.max(70, (W * H) / 6000)));
      flakes = [];
      LAYERS.forEach((l, L) => { for (let i = 0; i < Math.round(n * l[0]); i++) flakes.push(mkFlake(L, true)); });
      if (!running) drawStatic();
    };
    const rnd = (a, b) => a + Math.random() * (b - a);
    const spawn = (kind) => {
      let m;
      if (kind === "rise") m = { x: rnd(290, 660), y: rnd(1040, 1100), vx: rnd(-0.7, 0.7), vy: rnd(-4.2, -1.8), s: rnd(5, 13), life: rnd(110, 200) };
      else if (kind === "card") {
        const side = Math.random();
        const x = side < 0.5 ? rnd(190, 780) : (Math.random() < 0.5 ? rnd(170, 230) : rnd(740, 800));
        const y = side < 0.5 ? (Math.random() < 0.5 ? rnd(410, 460) : rnd(830, 890)) : rnd(430, 880);
        m = { x, y, vx: rnd(-0.4, 0.4), vy: rnd(-0.9, -0.2), s: rnd(4, 11), life: rnd(90, 170) };
      } else m = { x: rnd(190, 780), y: rnd(940, 1360), vx: rnd(-0.3, 0.3), vy: rnd(-0.5, -0.12), s: rnd(5, 12), life: rnd(240, 460) };
      m.age = 0; m.ph = Math.random() * 6.28;
      motes.push(m);
    };
    const target = () => Math.round((mode === "idle" ? 22 : mode === "glow" ? 42 : mode === "card" ? 90 : mode === "rise" ? 160 : 0) * boost);
    const step = (dt) => {
      const t = target();
      if (mode === "rise" && modeT < 150) for (let i = 0; i < 3; i++) if (motes.length < t) spawn("rise");
      if (mode === "card" && motes.length < t) { spawn("card"); spawn("card"); }
      if ((mode === "idle" || mode === "glow") && motes.length < t && Math.random() < 0.3) spawn("idle");
      modeT += dt;
      fade = mode === "off" ? Math.max(0, fade - 0.04 * dt) : Math.min(1, fade + 0.03 * dt);
      for (let i = motes.length - 1; i >= 0; i--) {
        const m = motes[i];
        m.age += dt; m.ph += 0.06 * dt;
        if (mode === "glow") { m.vx += (482 - m.x) * 0.00002 * dt; m.vy += (1098 - m.y) * 0.00001 * dt; }
        m.x += (m.vx + Math.sin(m.ph * 0.5) * 0.2) * dt; m.y += m.vy * dt;
        if (m.age > m.life || (mode === "off" && fade <= 0)) motes.splice(i, 1);
      }
      for (const f of flakes) {
        f.y += f.vy * dt; f.ph += 0.01 * dt; f.x += Math.sin(f.ph) * f.sw * 0.5 * dt;
        if (f.y > H + 6) { f.y = -6; f.x = Math.random() * W; }
        if (f.x > W + 6) f.x = -6; else if (f.x < -6) f.x = W + 6;
      }
    };
    /* 6つの光の先をもつ、小さな星のきらめき */
    const drawStar = (f) => {
      const R = f.r * 2.6, r = R * 0.34, tw = 0.65 + 0.35 * Math.sin(f.ph * 3);
      ctx.globalAlpha = Math.min(1, f.a * 1.1) * tw;
      ctx.fillStyle = "#fff4cf";
      ctx.beginPath();
      for (let i = 0; i < 12; i++) {
        const ang = f.ph * 0.4 + (i * Math.PI) / 6, rr = i % 2 ? r : R;
        const x = f.x + Math.cos(ang) * rr, y = f.y + Math.sin(ang) * rr;
        if (i) ctx.lineTo(x, y); else ctx.moveTo(x, y);
      }
      ctx.closePath(); ctx.fill();
      ctx.globalAlpha = f.a * 0.35 * tw;
      ctx.drawImage(gold, f.x - R * 1.6, f.y - R * 1.6, R * 3.2, R * 3.2);
    };
    const drawFlakes = () => {
      for (const f of flakes) {
        if (starOn && f.star) drawStar(f);
        else if (f.L === 2) { const s = f.r * 3.2; ctx.globalAlpha = f.a; ctx.drawImage(white, f.x - s, f.y - s, s * 2, s * 2); }
        else { ctx.globalAlpha = f.a; ctx.fillStyle = "#fff"; ctx.beginPath(); ctx.arc(f.x, f.y, f.r, 0, 6.283); ctx.fill(); }
      }
      ctx.globalAlpha = 1;
    };
    const draw = () => {
      ctx.clearRect(0, 0, W, H);
      const scr = app.dataset.screen;
      if (motes.length && fade > 0 && (scr === "start" || scr === "seq")) {
        ctx.globalCompositeOperation = "lighter";
        for (const m of motes) {
          const lifeA = Math.min(1, m.age / 30) * Math.min(1, (m.life - m.age) / 50);
          const a = Math.max(0, lifeA * (0.55 + 0.45 * Math.sin(m.ph)) * fade);
          const s = m.s * S.k * 2.2;
          ctx.globalAlpha = a;
          ctx.drawImage(gold, S.sx + m.x * S.k - s, S.sy + m.y * S.k - s, s * 2, s * 2);
        }
        ctx.globalCompositeOperation = "source-over";
        ctx.globalAlpha = 1;
      }
      drawFlakes();
    };
    const drawStatic = () => { ctx.clearRect(0, 0, W, H); drawFlakes(); };
    const frame = (t) => {
      if (!running) return;
      const dt = lastT ? Math.min(3, (t - lastT) / 16.67) : 1;
      lastT = t;
      step(dt); draw();
      requestAnimationFrame(frame);
    };
    const start = () => { if (running) return; running = true; lastT = 0; requestAnimationFrame(frame); };
    const stop = () => { running = false; motes = []; drawStatic(); };
    const setMode = (m) => { mode = m; modeT = 0; if (m === "idle") fade = 1; };
    const setStars = (on) => { starOn = !!on; if (!running) drawStatic(); };
    const setBoost = (k) => { boost = k || 1; };
    return { resize, start, stop, setMode, setStars, setBoost };
  })();

  /* ---------------------------------------------------------------
     オルゴールの音（WebAudio）
     本物のくし歯オルゴールのように、
       ・はじく瞬間のごく小さな「カチッ」
       ・澄んだ基音（サイン波）
       ・すぐに消える金属の高い響き（くし歯の倍音 約6倍・約17倍）
     を重ねて、1音ずつ少しだけ揺らぎ（音程・強さ・タイミング）をつけています。
     --------------------------------------------------------------- */
  const SEMI = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
  const midiOf = (n) => {
    const m = /^([A-G])([#b]?)(\d)$/.exec(n);
    if (!m) return null;
    return (Number(m[3]) + 1) * 12 + SEMI[m[1]] + (m[2] === "#" ? 1 : m[2] === "b" ? -1 : 0);
  };
  /* [音, 拍] の楽譜を「何拍目に何の音（長さ）」の並びに */
  const toEvents = (tune, shift) => {
    const ev = []; let b = 0;
    tune.forEach(([n, len]) => {
      const m = n === "r" ? null : midiOf(n);
      if (m !== null) ev.push({ b, m: m + (shift || 0), d: len });
      b += len;
    });
    return { ev, len: b };
  };
  /* 和音の名前 → 音の高さ（0〜11）の組 */
  const chordPcs = (name) => {
    const m = /^([A-G])([#b]?)(m?)$/.exec(name || "");
    if (!m) return null;
    const r = (SEMI[m[1]] + (m[2] === "#" ? 1 : m[2] === "b" ? -1 : 0) + 12) % 12;
    return { r, third: m[3] ? 3 : 4 };
  };
  /* ある範囲 [lo, hi] に入る、その和音の根音 */
  const rootIn = (pc, lo) => { let n = lo + ((pc - lo) % 12 + 12) % 12; return n; };

  /* 曲の楽譜を、メロディー＋やわらかい分散和音＋小さなきらめきに編曲します */
  const arrange = (notes, harmony) => {
    /* メロディーは C6〜C7 あたりへ（高すぎるときは上げません） */
    let mx = 0;
    notes.forEach(([n]) => { const m = midiOf(n); if (m !== null && m > mx) mx = m; });
    const shift = mx + 12 <= 101 ? 12 : 0;
    const { ev: mel, len } = toEvents(notes, shift);
    const out = [];
    const lastOn = mel.length ? mel[mel.length - 1].b : 0;
    mel.forEach((e, i) => {
      out.push({ b: e.b, m: e.m, v: 0.86 + Math.random() * 0.12, k: "mel" });
      /* 長くのばす音のあとに、ときどき小さな高い「きらり」 */
      if (e.d >= 2 && i !== mel.length - 1 && i % 2 === 0 && e.m + 12 <= 103) {
        out.push({ b: e.b + Math.min(1, e.d / 2), m: e.m + 12, v: 0.16, k: "tw" });
      }
    });
    /* その時に鳴っているメロディーの音 */
    const melAt = (b) => { let m = 200; for (const e of mel) { if (e.b <= b + 1e-6) m = e.m; else break; } return m; };
    if (harmony && harmony.length) {
      const segs = harmony.map(([s, name], i) => ({ s, e: i + 1 < harmony.length ? harmony[i + 1][0] : len, c: chordPcs(name) }));
      segs.forEach((sg, si) => {
        if (!sg.c) return;
        const r = rootIn(sg.c.r, 72); /* C5〜B5 */
        const pat = [r, r + 7, r + 12 + sg.c.third, r + 7];
        const alt = [r, r + 7, r + sg.c.third, r + 7]; /* 上の音がメロディーにぶつかるときの形 */
        const vel = [0.3, 0.2, 0.24, 0.17];
        let j = 0;
        for (let p = sg.s; p < sg.e - 1e-6 && p < lastOn + 0.01; p += 1, j++) {
          const cur = melAt(p), top = cur - 2;
          const rub = (x) => [1, 6, 11].includes(((cur - x) % 12 + 12) % 12); /* 半音・増4度でぶつかる音はさける */
          let m = pat[j % 4];
          if (m > top || rub(m)) m = alt[j % 4];
          if (m > top || rub(m)) continue;
          out.push({ b: p, m, v: vel[j % 4] * (0.85 + Math.random() * 0.2), k: "acc" });
        }
        /* はじめと終わりの和音だけ、ごく小さな低い音 */
        if (si === 0 || sg.s >= lastOn - 1e-6 || (sg.s <= len / 2 && sg.e > len / 2)) {
          out.push({ b: sg.s, m: rootIn(sg.c.r, 55), v: 0.13, k: "bass" });
        }
        /* 最後の音の上に、きらきらと上がっていく小さな音 */
        if (sg.s <= lastOn + 1e-6 && sg.e >= len - 1e-6) {
          const lastM = mel[mel.length - 1].m;
          const pcs = [sg.c.r, (sg.c.r + sg.c.third) % 12, (sg.c.r + 7) % 12];
          const up = [];
          for (let m = lastM + 1; m <= 107 && up.length < 3; m++) if (pcs.includes(((m % 12) + 12) % 12)) up.push(m);
          up.forEach((m, q) => out.push({ b: lastOn + 0.75 + q * 0.33, m, v: 0.14 - q * 0.025, k: "tw" }));
        }
      });
    } else if (mel.length) {
      const lastM = mel[mel.length - 1].m;
      if (lastM + 12 <= 105) out.push({ b: lastOn + 0.75, m: lastM + 12, v: 0.13, k: "tw" });
    }
    out.sort((x, y) => x.b - y.b);
    /* 最後の音に向かって、ほんの少しゆっくりに（リタルダンド） */
    const R = Math.min(3, Math.max(1, lastOn * 0.25));
    const warp = (b) => { const x = Math.max(0, (b - (lastOn - R)) / R); return b + 0.6 * x * x; };
    return { ev: out, len: Math.max(len, out.length ? out[out.length - 1].b + 1 : len), warp };
  };

  /* 背景の音：オリジナルの、ゆっくりした分散和音（D–Bm–G–A を2回）
     雪がきらきら舞うように、高い音域で静かにくり返します */
  const AMBIENT = (() => {
    const ev = [];
    const chords = [[62, 4], [59, 3], [55, 4], [57, 4]]; /* D, Bm, G, A（根音, 3度） */
    const tops = [[93, 90, 95, 97], [98, 95, 98, 97]];   /* いちばん上で鳴らす、やわらかな音 */
    const rnd = (() => { let s = 7; return () => { s = (s * 16807) % 2147483647; return s / 2147483647; }; })();
    for (let cyc = 0; cyc < 2; cyc++) {
      chords.forEach(([root, third], ci) => {
        const b0 = (cyc * 4 + ci) * 4;
        const r = rootIn(root % 12, 74);
        const up = [r, r + 7, r + 12, r + 12 + third, r + 19];
        /* 上へのぼる分散和音（ところどころ休み） */
        ev.push({ b: b0, m: r, v: 0.26 });
        ev.push({ b: b0 + 0.5, m: r + 7, v: 0.16 });
        if (rnd() > 0.25) ev.push({ b: b0 + 1, m: up[2 + ((ci + cyc) % 2)], v: 0.18 });
        ev.push({ b: b0 + 1.5, m: r + 19 > 100 ? r + 12 + third : r + 19, v: 0.14 });
        /* 上で光る音 */
        ev.push({ b: b0 + 2, m: tops[cyc][ci], v: 0.3 });
        if (rnd() > 0.4) ev.push({ b: b0 + 3, m: up[1 + Math.floor(rnd() * 3)], v: 0.13 });
        if (rnd() > 0.55) {
          const pcs = [root % 12, (root + third) % 12, (root + 7) % 12];
          let m = tops[cyc][ci] + 1; while (m < 106 && !pcs.includes(m % 12)) m++;
          if (m <= 105) ev.push({ b: b0 + 3.5, m, v: 0.09 });
        }
        if (ci === 0) ev.push({ b: b0, m: rootIn(root % 12, 60), v: 0.1 });
      });
    }
    ev.sort((x, y) => x.b - y.b);
    ev.forEach((e) => { e.k = "amb"; });
    return { ev, len: 32, bpm: 62, warp: (b) => b };
  })();

  /* 世界一周のお祝いのメドレー：各国の曲のはじめの数小節を、オルゴールのまま順番につなぎます。
     曲ごとに速さがちがうので、ここで「秒」に直して1本の楽譜にします（bpm 60 = 1拍1秒で再生）。
     前の曲の最後の音が響いているあいだに、次の曲がそっと（小さめの音から）入ってきます。 */
  const buildMedley = (list) => {
    const T = D.T || {}, H = D.H || {};
    const ev = []; let off = 0;
    list.forEach((it, n) => {
      const full = T[it.id]; if (!full) return;
      const last = n === list.length - 1;
      /* はじめの it.beats 拍まで（0 なら全部） */
      const notes = []; let b = 0;
      for (const nt of full) { if (it.beats && b >= it.beats - 1e-6) break; notes.push(nt); b += nt[1]; }
      const harm = (H[it.id] || []).filter(([s0]) => s0 < b - 1e-6);
      const seq = arrange(notes, harm);
      const spb = 60 / (it.bpm || 150);
      let lastOn = 0;
      seq.ev.forEach((e) => { if (e.k === "mel") lastOn = Math.max(lastOn, e.b); });
      seq.ev.forEach((e) => {
        if (!last && e.k === "tw" && e.b > lastOn) return; /* 途中の曲の終わりのきらめきは省きます */
        let v = e.v;
        if (n > 0 && e.b < 1.5) v *= 0.72 + 0.28 * (e.b / 1.5); /* 入りはそっと */
        ev.push({ b: off + seq.warp(e.b) * spb, m: e.m, v, k: e.k });
      });
      off += seq.warp(b) * spb + (last ? 0 : 0.35);
    });
    ev.sort((x, y) => x.b - y.b);
    return { ev, len: off + 1.5, warp: (x) => x };
  };

  const Audio = (() => {
    let ctx = null, input = null, ambBus = null, tuneBus = null, sfxBus = null, noise = null;
    let amb = null, tune = null, resumeTimer = 0;
    const AMB_VOL = 0.85;
    const LOOK = 0.8; /* 何秒先まで音を予約しておくか */
    const ensure = () => {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      if (!ctx) {
        try {
          ctx = new AC();
          /* 音の通り道：低音カット → 高音を少し明るく → やさしいコンプレッサー → 全体の音量 */
          input = ctx.createGain(); input.gain.value = 1;
          const lowCut = ctx.createBiquadFilter(); lowCut.type = "highpass"; lowCut.frequency.value = 250; lowCut.Q.value = 0.6;
          const bright = ctx.createBiquadFilter(); bright.type = "highshelf"; bright.frequency.value = 5200; bright.gain.value = 3;
          const comp = ctx.createDynamicsCompressor();
          comp.threshold.value = -20; comp.knee.value = 16; comp.ratio.value = 3; comp.attack.value = 0.004; comp.release.value = 0.3;
          const master = ctx.createGain(); master.gain.value = 0.27;
          input.connect(lowCut); lowCut.connect(bright); bright.connect(comp); comp.connect(master); master.connect(ctx.destination);
          /* 空気のような残響（その場で作る約3秒の響き。高い音ほど長く残ります） */
          try {
            const sr = ctx.sampleRate, secs = 3.2, n = Math.floor(sr * secs), pre = Math.floor(sr * 0.014);
            const buf = ctx.createBuffer(2, n, sr);
            for (let ch = 0; ch < 2; ch++) {
              const d = buf.getChannelData(ch); let prev = 0, lp = 0;
              for (let i = pre; i < n; i++) {
                const w = Math.random() * 2 - 1;
                const hi = w - 0.7 * prev; prev = w;    /* 高い音を強める */
                lp += 0.08 * (w - lp);                  /* ほんの少しの丸み */
                const t = (i - pre) / sr;
                const env = Math.exp(-t * 2.1) * Math.min(1, (i - pre) / (sr * 0.012));
                d[i] = (hi * 0.75 + lp * 0.6) * env;
              }
            }
            const verb = ctx.createConvolver(); verb.buffer = buf;
            const vCut = ctx.createBiquadFilter(); vCut.type = "highpass"; vCut.frequency.value = 380;
            const wet = ctx.createGain(); wet.gain.value = 0.33;
            input.connect(verb); verb.connect(vCut); vCut.connect(wet); wet.connect(bright);
          } catch (e) { /* 残響なしでも鳴ります */ }
          try {
            const nb = ctx.createBuffer(1, Math.floor(ctx.sampleRate * 0.03), ctx.sampleRate);
            const d = nb.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
            noise = nb;
          } catch (e) { noise = null; }
          const bus = (v) => { const g = ctx.createGain(); g.gain.value = v; g.connect(input); return g; };
          ambBus = bus(AMB_VOL); tuneBus = bus(1); sfxBus = bus(0.85);
        } catch (e) { ctx = null; return null; }
      }
      if (ctx.state === "suspended" && !document.hidden) ctx.resume().catch(() => {});
      return ctx;
    };
    /* 音の高さに合わせて、左右に少しだけ広げます */
    const panFor = (out, midi) => {
      try {
        if (!ctx.createStereoPanner) return out;
        const p = ctx.createStereoPanner();
        p.pan.value = Math.max(-1, Math.min(1, (midi - 86) / 14)) * 0.3;
        p.connect(out); return p;
      } catch (e) { return out; }
    };
    const env = (g, t, peak, atk, dec) => {
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(peak, t + atk);
      g.gain.exponentialRampToValueAtTime(Math.max(peak * 0.0004, 0.000001), t + atk + dec);
    };
    const osc = (dst, f, t, peak, atk, dec) => {
      if (f > 16000 || peak <= 0) return;
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.type = "sine"; o.frequency.value = f;
      env(g, t, peak, atk, dec);
      o.connect(g); g.connect(dst);
      o.start(t); o.stop(t + atk + dec + 0.05);
    };
    /* はじく瞬間のごく小さな音 */
    const click = (dst, f, t, peak) => {
      if (!noise || peak <= 0) return;
      try {
        const s = ctx.createBufferSource(); s.buffer = noise;
        const hp = ctx.createBiquadFilter(); hp.type = "bandpass"; hp.frequency.value = Math.min(9000, f * 3); hp.Q.value = 0.9;
        const g = ctx.createGain();
        g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(peak, t + 0.0008); g.gain.exponentialRampToValueAtTime(peak * 0.001, t + 0.012);
        s.connect(hp); hp.connect(g); g.connect(dst);
        s.start(t); s.stop(t + 0.03);
      } catch (e) { /* なにもしない */ }
    };
    /* オルゴールの1音 */
    const tine = (out, midi, t, vol, opt) => {
      const o = opt || {};
      const cents = (Math.random() * 2 - 1) * 4;
      const f = 440 * Math.pow(2, (midi - 69 + cents / 100) / 12);
      const v = (vol || 1) * (0.9 + Math.random() * 0.1) * (midi > 96 ? 0.82 : 1);
      const a = 0.3 * v;
      const ring = (o.ring || 1) * Math.max(1.2, Math.min(2.0, 2.0 - (midi - 84) / 30));
      const dst = panFor(out, midi);
      const atk = 0.0015;
      osc(dst, f, t, a, atk, ring * 1.4);                                       /* 基音 */
      if (o.shimmer) osc(dst, f * Math.pow(2, (3 + Math.random() * 3) / 1200), t, a * 0.22, atk, ring * 1.6); /* ほんの少しずれた2本目のくし歯 */
      const hiAmp = midi > 92 ? 0.06 : 0.1;
      osc(dst, f * (5.9 + Math.random() * 0.4), t, a * hiAmp, 0.001, 0.15 + Math.random() * 0.25);  /* くし歯の高い響き */
      osc(dst, f * (16.8 + Math.random() * 0.5), t, a * 0.03, 0.001, 0.08 + Math.random() * 0.06);
      click(dst, f, t, a * 0.12);
    };
    const KIND = {
      mel: { shimmer: true, ring: 1 },
      acc: { shimmer: false, ring: 0.85 },
      bass: { shimmer: false, ring: 1.2 },
      tw: { shimmer: false, ring: 0.7 },
      amb: { shimmer: true, ring: 1.1 }
    };
    /* 少し先まで音を予約していく再生係（重ならないよう1曲ずつ） */
    const player = (seq, bpm, bus, loop, onEnd) => {
      const spb = 60 / bpm;
      const warp = seq.warp || ((b) => b);
      const out = ctx.createGain(); out.gain.value = 1; out.connect(bus);
      let start = ctx.currentTime + 0.08, idx = 0, stopped = false;
      const endAt = () => start + warp(seq.len) * spb;
      const tick = () => {
        if (stopped) return;
        const now = ctx.currentTime, horizon = now + LOOK;
        for (;;) {
          if (idx >= seq.ev.length) {
            if (loop) { idx = 0; start += seq.len * spb; continue; }
            if (now > endAt() + 1.2) { finish(); if (onEnd) onEnd(); }
            return;
          }
          const e = seq.ev[idx];
          const jit = (Math.random() * 2 - 1) * (e.k === "mel" ? 0.008 : 0.012);
          const t = start + warp(e.b) * spb + (e.b > 0 ? jit : 0);
          if (t > horizon) return;
          if (t >= now - 0.05) { try { tine(out, e.m, Math.max(t, now + 0.005), e.v, KIND[e.k] || KIND.mel); } catch (err) { /* 1音だけ飛ばします */ } }
          idx++;
        }
      };
      const timer = setInterval(tick, 110);
      const finish = () => { stopped = true; clearInterval(timer); setTimeout(() => { try { out.disconnect(); } catch (e) { /* もう外れています */ } }, 5000); };
      tick();
      return {
        get done() { return stopped; },
        stop(fadeSec) {
          if (stopped) return;
          const f = fadeSec == null ? 0.6 : fadeSec;
          try { const now = ctx.currentTime; out.gain.cancelScheduledValues(now); out.gain.setValueAtTime(out.gain.value, now); out.gain.linearRampToValueAtTime(0.0001, now + f); } catch (e) { /* なにもしない */ }
          finish();
        }
      };
    };
    const startAmbient = (fadeIn) => {
      try {
        if (!prefs.sound || !ensure()) return;
        if (amb && !amb.done) return;
        const now = ctx.currentTime;
        ambBus.gain.cancelScheduledValues(now);
        ambBus.gain.setValueAtTime(0.0001, now);
        ambBus.gain.linearRampToValueAtTime(AMB_VOL, now + (fadeIn == null ? 2.5 : fadeIn));
        amb = player(AMBIENT, AMBIENT.bpm, ambBus, true);
      } catch (e) { /* 音なしで続けます */ }
    };
    const stopAmbient = (f) => { if (amb) { amb.stop(f); amb = null; } };
    const stopTune = (f) => { if (tune) { tune.stop(f); tune = null; } };
    /* 楽譜から、その曲の伴奏（data.js の H）を探します */
    const harmonyOf = (notes) => {
      try { const T = D.T || {}, H = D.H || {}; for (const k in T) if (T[k] === notes) return H[k] || null; } catch (e) { /* なし */ }
      return null;
    };
    /* 曲（楽譜を編曲したもの）を流す：背景の音をそっと小さくしてから流し、終わったら背景の音にもどす */
    const playSeq = (seq, bpm) => {
      try {
        clearTimeout(resumeTimer);
        if (!prefs.sound || !ensure()) return;
        stopTune(0.4);
        stopAmbient(0.9);
        const me = player(seq, bpm, tuneBus, false, () => {
          if (tune === me) { tune = null; resumeTimer = setTimeout(() => startAmbient(3), 600); }
        });
        tune = me;
      } catch (e) { /* 音なしで続けます */ }
    };
    /* 国の曲 */
    const playTune = (notes, bpm) => { try { playSeq(arrange(notes, harmonyOf(notes)), bpm); } catch (e) { /* 音なしで続けます */ } };
    /* 世界一周のメドレー（1拍＝1秒に直してあるので bpm 60） */
    let medleySeq = null;
    const playMedley = (list) => {
      try { if (!medleySeq) medleySeq = buildMedley(list); playSeq(medleySeq, 60); } catch (e) { /* 音なしで続けます */ }
    };
    /* 今の曲をそっと止めて、少ししてから背景の音にもどす（お祝いの画面を閉じたときなど） */
    const endTune = (f) => {
      if (!tune || tune.done) return;
      const fade = f == null ? 1.2 : f;
      clearTimeout(resumeTimer);
      stopTune(fade);
      if (prefs.sound) resumeTimer = setTimeout(() => startAmbient(3), fade * 1000 + 300);
    };
    /* ガラスの鈴（グロッケン／チェレスタのような、倍音がずれた澄んだ音） */
    const bell = (when, base, vol) => {
      try {
        if (!prefs.sound || !ensure()) return;
        const t0 = ctx.currentTime + 0.01 + (when || 0);
        const f = base || 1760, v = (vol || 0.4) * 0.42;
        const midi = 69 + 12 * Math.log2(f / 440);
        const dst = panFor(sfxBus, midi + (Math.random() * 6 - 3));
        [[1, 1, 2.4], [1.0035, 0.3, 2.9], [2.756, 0.22, 0.8], [5.404, 0.09, 0.32], [8.933, 0.04, 0.16]].forEach(([mul, amp, dec]) => {
          osc(dst, f * mul, t0, amp * v, 0.0012, dec);
        });
        click(dst, f, t0, v * 0.06);
      } catch (e) { /* なにもしない */ }
    };
    /* きらめく光の音（高い音が上へのぼる小さなアルペジオ。どの曲の調ともぶつからない D・E・G・A の音） */
    const sparkle = (when, vol) => {
      try {
        if (!prefs.sound || !ensure()) return;
        const t0 = ctx.currentTime + 0.01 + (when || 0);
        const v0 = (vol || 0.3) * 0.6;
        [86, 88, 91, 93, 98, 100, 103, 105].forEach((m, i) => {
          tine(sfxBus, m, t0 + i * 0.055 + Math.random() * 0.01, v0 * (1 - i * 0.06), { ring: 0.6 });
        });
      } catch (e) { /* なにもしない */ }
    };
    /* 箱を開けるときの音：ガラスの鈴を重ねて、きらきらと上へ */
    const chime = () => {
      bell(0, 1760, 0.42); bell(0.07, 2349.3, 0.3); bell(0.14, 2637, 0.22); bell(0.23, 3520, 0.12);
      sparkle(0.32, 0.22);
    };
    const allOff = () => { clearTimeout(resumeTimer); stopTune(0.3); stopAmbient(0.3); };
    const unlock = () => {
      try {
        if (!ensure()) return;
        if (prefs.sound && !(amb && !amb.done) && !(tune && !tune.done)) startAmbient(2.5);
      } catch (e) { /* なにもしない */ }
    };
    const suspend = () => { try { if (ctx && ctx.state === "running") ctx.suspend().catch(() => {}); } catch (e) { /* なにもしない */ } };
    const resume = () => { try { if (ctx && ctx.state === "suspended") ctx.resume().catch(() => {}); } catch (e) { /* なにもしない */ } };
    return { unlock, startAmbient, playTune, playMedley, endTune, chime, bell, sparkle, allOff, suspend, resume, get ready() { return !!ctx; } };
  })();

  /* ---------------------------------------------------------------
     おみくじを引く
     --------------------------------------------------------------- */
  const C = D.countries;
  const pickWeighted = (arr) => {
    const total = arr.reduce((s, x) => s + (x.weight || 1), 0);
    let r = Math.random() * total;
    for (const x of arr) { r -= x.weight || 1; if (r < 0) return x; }
    return arr[0];
  };
  const pickCountry = () => {
    let pool = C.filter((c) => c.id !== store.lastCountry);
    if (!pool.length) pool = C.slice();
    const unvisited = pool.filter((c) => !stamps.has(c.id));
    /* まだの国を少し優先（毎回ではありません） */
    if (unvisited.length && Math.random() < 0.75) pool = unvisited;
    return pool[Math.floor(Math.random() * pool.length)];
  };
  const pickByTheme = (list, themes, lastIdx, prob) => {
    let idxs = list.map((_, i) => i).filter((i) => i !== lastIdx);
    if (!idxs.length) idxs = list.map((_, i) => i);
    const match = idxs.filter((i) => (list[i].themes || []).some((t) => themes.includes(t)));
    if (match.length && Math.random() < prob) idxs = match;
    return idxs[Math.floor(Math.random() * idxs.length)];
  };
  const drawResult = () => {
    const fortune = pickWeighted(D.fortunes);
    const country = pickCountry();
    const mi = pickByTheme(D.messages, fortune.themes, store.lastMsg, 0.85);
    const li = pickByTheme(D.luckyItems, fortune.themes, store.lastLucky, 0.7);
    return { mode: "draw", fortune, country, message: D.messages[mi], lucky: D.luckyItems[li], mi, li, isNew: !stamps.has(country.id) };
  };

  /* ---------------------------------------------------------------
     世界一周のあとのひみつ
     ・黄金の特別なおみくじ（一度だけ）
     ・ひみつの14番目の旅先「北極星の村」
     --------------------------------------------------------------- */
  const SECRET = D.secret, GOLD = D.golden;
  const tourDone = () => stamps.size >= C.length;
  const goldenReady = () => tourDone() && !store.goldenDrawn;
  /* 黄金のおみくじの結果（i：特別なひとことの番号。同じ結果を何度でも作り直せます） */
  const goldenResult = (i) => {
    const n = GOLD.messages.length;
    const mi = Number.isInteger(i) && i >= 0 && i < n ? i : Math.floor(Math.random() * n);
    return { mode: "draw", golden: true, fortune: GOLD.fortune, country: SECRET, message: { text: GOLD.messages[mi] }, lucky: GOLD.lucky, mi, li: -1, isNew: false };
  };
  /* 最初の画面を、世界一周のあとの「特別な夜」に（オーロラ・星の雪・黄金の箱） */
  const updateStartState = () => {
    const done = tourDone(), gold = goldenReady();
    app.classList.toggle("tour-done", done);
    app.classList.toggle("golden", gold);
    app.classList.toggle("golden-settled", done && !gold);
    fill($("openLabel"), gold ? "黄金の箱を開ける" : "魔法の箱を開ける");
    $("openBtn").classList.toggle("golden-btn", gold);
    $("goldenNote").hidden = !gold;
    FX.setStars(done);
    FX.setBoost(gold ? 1.5 : 1);
  };

  /* ---------------------------------------------------------------
     画面の切りかえ
     --------------------------------------------------------------- */
  const screens = { result: $("result"), book: $("book"), celebrate: $("celebrate") };
  const setScreen = (name) => {
    /* お祝いの画面を離れるとき：流れ星とメドレーをそっと止める */
    if (app.dataset.screen === "celebrate" && name !== "celebrate") { Meteors.stop(); Audio.endTune(1.2); }
    app.dataset.screen = name;
    Object.keys(screens).forEach((k) => { screens[k].hidden = k !== name; });
  };
  const setScene = (n) => {
    document.querySelectorAll(".scene.sc2, .scene.sc3").forEach((el) => el.classList.toggle("on", (n === 2 && el.classList.contains("sc2")) || (n === 3 && el.classList.contains("sc3"))));
    document.querySelectorAll(".bd").forEach((el, i) => el.classList.toggle("on", i + 1 === n));
  };

  /* ---------------------------------------------------------------
     第2幕・第3幕：魔法の箱が開く
     --------------------------------------------------------------- */
  let busy = false, pending = null, current = null, lastDraw = null, seqTimers = [];
  const later = (ms, fn) => { seqTimers.push(setTimeout(fn, ms)); };
  const clearSeq = () => { seqTimers.forEach(clearTimeout); seqTimers = []; };

  /* 第2・3幕の言葉（黄金のときは特別な言葉に） */
  const setSeqText = (golden) => {
    const t = $("seqText"); t.textContent = "";
    const [a, b] = golden ? ["世界一周したあなたへ", "特別な贈り物が届きました。"] : ["世界のどこかから", "あなたへの贈り物が届きました。"];
    t.append(document.createTextNode(a), document.createElement("br"), document.createTextNode(b));
  };
  const startJourney = () => {
    if (busy || app.dataset.screen !== "start") return;
    busy = true;
    $("openBtn").disabled = true;
    Audio.unlock();
    const gold = goldenReady();
    pending = gold ? goldenResult() : drawResult();
    app.classList.toggle("golden-run", gold);
    if (gold) { FX.setBoost(1.6); later(700, () => Audio.bell(0, 2637, 0.16)); }
    setSeqText(gold);
    $("seqText").classList.remove("show");
    setScreen("seq");
    if (isCalm()) {
      Audio.chime();
      setScene(3);
      app.classList.add("act3");
      later(450, () => $("seqText").classList.add("show"));
      later(2600, finishJourney);
      return;
    }
    app.classList.add("act-glow");
    FX.setMode("glow");
    later(380, Audio.chime);
    later(950, () => app.classList.add("untie"));
    later(2000, () => { setScene(2); app.classList.add("act2"); app.classList.remove("act-glow"); FX.setMode("rise"); });
    later(2300, () => Audio.sparkle(0, 0.18));
    later(4100, () => { setScene(3); app.classList.add("act3"); FX.setMode("card"); });
    later(4700, () => $("seqText").classList.add("show"));
    later(6700, () => { app.classList.add("zooming"); FX.setMode("off"); Audio.bell(0, 1760, 0.22); });
    later(7600, finishJourney);
  };
  const finishJourney = () => {
    if (!pending) return;
    clearSeq();
    const res = pending; pending = null;
    /* ズームを一瞬でもとにもどす（結果の画面の後ろで） */
    const inner = $("stageInner");
    inner.style.transition = "none";
    app.classList.remove("zooming", "untie", "act-glow", "act2", "golden-run");
    app.classList.add("act3");
    setScene(3);
    void inner.offsetWidth;
    inner.style.transition = "";
    FX.setMode("off");
    showResult(res);
  };
  const goHome = () => {
    if (app.dataset.screen === "seq") return;
    clearSeq();
    app.classList.remove("act2", "act3", "act-glow", "untie", "zooming", "golden-run");
    setScene(1);
    setScreen("start");
    updateStartState();
    FX.setMode("idle");
    busy = false;
    $("openBtn").disabled = false;
    setTimeout(() => $("openBtn").focus({ preventScroll: true }), 50);
  };

  /* ---------------------------------------------------------------
     第4幕：クリスマスカード（3ページの絵本）
     --------------------------------------------------------------- */
  const pagesEl = $("pages");
  let pageCount = 3, pageIdx = 0;
  const isLatin = (s) => /^[\u0000-ɏ\s!¡'’.,-]+$/.test(s);
  const fill = (el, text) => { el.textContent = text; };

  /* ページの見出し（ひみつの旅先では、その村のための言葉に） */
  const LABELS = { greet: "この国のメリークリスマス", customs: "クリスマスの過ごし方", food: "伝統的な料理・習慣", intro: "旅へのおさそい" };
  const FOOT = "※各国のクリスマスの習わしは代表的な一例です。地域や家庭によってさまざまです。";
  const FOOT_SECRET = "※「北極星の村」は、昔から物語の中で語り継がれてきた伝説の村です。実在する場所ではありません。";
  const renderCard = (res) => {
    const c = res.country, info = res.mode === "info";
    $("card").classList.toggle("info-mode", info);
    $("card").classList.toggle("golden", !!res.golden);
    $("card").classList.toggle("secret", !!c.secret);
    const lb = c.labels || LABELS;
    fill($("lblGreet"), lb.greet); fill($("lblCustoms"), lb.customs); fill($("lblFood"), lb.food); fill($("lblIntro"), lb.intro);
    fill($("footnote"), c.secret ? FOOT_SECRET : FOOT);
    if (!info) {
      fill($("fKicker"), res.golden ? "世界一周の特別な贈り物" : "あなたへの贈り物");
      $("fSymbol").innerHTML = A.fortuneSymbol(res.fortune.symbol);
      fill($("fName"), res.fortune.name);
      fill($("fTheme"), res.fortune.theme);
      fill($("fLine"), "〈" + res.fortune.name + "〉" + res.fortune.line);
    }
    fill($("destLabel"), c.secret ? "あなただけの、ひみつの旅先" : info ? "クリスマスの旅先" : "あなたに届いたクリスマスの旅先");
    fill($("cFlag"), c.flag);
    fill($("cName"), c.name);
    const city = $("cCity"); city.textContent = "";
    const b = document.createElement("b"); b.textContent = c.secret ? c.legend : c.city;
    const en = document.createElement("i"); en.textContent = c.secret ? c.cityEn : c.cityEn + ", " + c.nameEn;
    city.append(b, document.createTextNode(c.secret ? "　" : " "), en);
    const land = $("landscape"); land.textContent = "";
    const putArt = () => { land.innerHTML = A.postcard(c); };
    if (c.image) {
      const img = document.createElement("img");
      img.alt = c.city + "のクリスマスの風景";
      img.decoding = "async";
      img.onerror = putArt;
      img.src = c.image;
      land.appendChild(img);
    } else putArt();
    land.setAttribute("aria-label", c.secret ? "オーロラの下の、雪の小さな村の風景（物語のイラスト）" : c.city + "のクリスマスの風景（イラスト）");

    const g = $("gText"); g.textContent = c.greeting; g.classList.toggle("cjk", !isLatin(c.greeting));
    const r = $("gRead"); r.textContent = c.reading ? "（" + c.reading + "）" : ""; r.hidden = !c.reading;
    fill($("gLang"), c.language);
    fill($("cCustoms"), c.customs);
    fill($("cFood"), c.food);
    fill($("cIntro"), c.intro);
    fill($("cSong"), "♪ 流れている曲：" + c.song);
    fill($("cSongNote"), c.songNote || "");

    if (!info) {
      const m = $("mText"); m.textContent = "";
      res.message.text.split("\n").forEach((line) => { if (!line.trim()) return; const p = document.createElement("p"); p.textContent = line; m.appendChild(p); });
      $("lIcon").innerHTML = A.luckyIcon(res.lucky.icon);
      fill($("lName"), res.lucky.name);
      fill($("lMean"), res.lucky.meaning);
    }
    $("drawActions").hidden = info;
    $("infoActions").hidden = !info;

    pageCount = info ? 2 : 3;
    const dots = $("dots"); dots.textContent = "";
    for (let i = 0; i < pageCount; i++) {
      const d = document.createElement("button");
      d.type = "button"; d.setAttribute("aria-label", (i + 1) + "ページ目へ");
      d.addEventListener("click", () => goPage(i));
      dots.appendChild(d);
    }
    document.querySelectorAll(".page").forEach((p) => { p.scrollTop = 0; });
    pagesEl.style.scrollBehavior = "auto";
    pagesEl.scrollLeft = 0;
    pagesEl.style.scrollBehavior = "";
    pageIdx = 0; updateNav();
  };
  const updateNav = () => {
    $("prevPage").disabled = pageIdx <= 0;
    $("nextPage").disabled = pageIdx >= pageCount - 1;
    [...$("dots").children].forEach((d, i) => d.setAttribute("aria-current", String(i === pageIdx)));
  };
  const goPage = (i) => {
    pageIdx = Math.max(0, Math.min(pageCount - 1, i));
    pagesEl.scrollTo({ left: pageIdx * pagesEl.clientWidth, behavior: isCalm() ? "auto" : "smooth" });
    updateNav();
  };
  let scrollRaf = 0;
  pagesEl.addEventListener("scroll", () => {
    cancelAnimationFrame(scrollRaf);
    scrollRaf = requestAnimationFrame(() => {
      const w = pagesEl.clientWidth || 1;
      const i = Math.round(pagesEl.scrollLeft / w);
      if (i !== pageIdx) { pageIdx = i; updateNav(); }
    });
  }, { passive: true });
  pagesEl.addEventListener("keydown", (e) => {
    if (e.key === "ArrowRight") { e.preventDefault(); goPage(pageIdx + 1); }
    if (e.key === "ArrowLeft") { e.preventDefault(); goPage(pageIdx - 1); }
  });

  const showCard = (res, opts) => {
    const o = opts || {};
    current = res;
    renderCard(res);
    setScreen("result");
    /* 画面が見えてから1ページ目にもどす（隠れている間はスクロール位置を変えられないため） */
    pagesEl.style.scrollBehavior = "auto";
    pagesEl.scrollLeft = 0;
    pagesEl.style.scrollBehavior = "";
    pageIdx = 0; updateNav();
    const card = $("card");
    card.classList.remove("enter"); void card.offsetWidth; card.classList.add("enter");
    screens.result.scrollTop = 0;
    if (o.music !== false) Audio.playTune(res.country.tune, res.country.bpm);
  };

  const showResult = (res) => {
    lastDraw = res;
    if (res.golden) {
      /* 黄金のおみくじ：一度きり。結果を覚えておき、ひみつの旅先もここで開きます */
      const first = !store.secretRevealed;
      store.goldenDrawn = true; store.secretRevealed = true; store.goldenMsg = res.mi;
      saveStore();
      showCard(res);
      if (first) later(1300, () => pressStamp(SECRET, true));
      else toast("世界一周したあなたへ、奇跡の大吉が届きました。", 4200);
      setTimeout(() => { busy = false; $("openBtn").disabled = false; }, 400);
      return;
    }
    store.lastCountry = res.country.id; store.lastMsg = res.mi; store.lastLucky = res.li;
    showCard(res);
    if (res.isNew) {
      stamps.add(res.country.id);
      saveStore();
      later(1300, () => pressStamp(res.country));
      later(4200, () => maybeCelebrate("result"));
    } else saveStore();
    setTimeout(() => { busy = false; $("openBtn").disabled = false; }, 400);
  };

  /* 新しいスタンプが押される演出 */
  const pressStamp = (c, isSecret) => {
    const box = $("stampPress");
    $("spStamp").innerHTML = isSecret ? A.secretStamp(c, true) : A.stamp(c, C.indexOf(c), { got: true });
    box.classList.toggle("secret", !!isSecret);
    box.classList.remove("show"); void box.offsetWidth; box.classList.add("show");
    Audio.bell(0.1, 1567.98, 0.32); Audio.bell(0.32, 2093, 0.18);
    if (isSecret) { Audio.bell(0.55, 2637, 0.14); toast("ひみつの旅先「" + c.name + "」が、スタンプ帳に加わりました。"); }
    else toast("新しいクリスマスの旅先がスタンプ帳に加わりました！");
    setTimeout(() => box.classList.remove("show"), 2600);
  };

  /* ---------------------------------------------------------------
     スタンプ帳
     --------------------------------------------------------------- */
  let bookFrom = "start";
  const renderBook = () => {
    const grid = $("stampGrid"); grid.textContent = "";
    C.forEach((c, i) => {
      const got = stamps.has(c.id);
      const li = document.createElement("li");
      const btn = document.createElement("button");
      btn.type = "button"; btn.className = "stamp-btn";
      const art = document.createElement("div"); art.className = "stamp-art"; art.innerHTML = A.stamp(c, i, { got });
      const nm = document.createElement("div"); nm.className = "stamp-name";
      if (got) {
        const f = document.createElement("span"); f.className = "flag"; f.textContent = c.flag;
        nm.append(f, document.createTextNode(c.name));
        btn.setAttribute("aria-label", c.name + "のスタンプ。押すと" + c.name + "のクリスマスをもう一度見られます");
        btn.addEventListener("click", () => openInfo(c));
      } else {
        nm.textContent = "まだ見ぬ国";
        btn.setAttribute("aria-disabled", "true");
        btn.setAttribute("aria-label", "まだ訪れていない国のスタンプ");
      }
      btn.append(art, nm); li.appendChild(btn); grid.appendChild(li);
    });
    if (tourDone()) grid.appendChild(secretSlot());
    const n = stamps.size, total = C.length;
    const pt = $("progressText"); pt.textContent = "";
    const bn = document.createElement("b"); bn.textContent = String(n);
    pt.append(document.createTextNode("あなたのクリスマスの旅　"), bn, document.createTextNode(" / " + total + "か国"));
    if (tourDone() && store.secretRevealed) {
      const badge = document.createElement("span"); badge.className = "secret-badge"; badge.textContent = "＋ひみつの旅先";
      pt.append(badge);
    }
    $("progressFill").style.width = (total ? (n / total) * 100 : 0) + "%";
    const pb = $("progressBar"); pb.setAttribute("aria-valuemax", String(total)); pb.setAttribute("aria-valuenow", String(n)); pb.setAttribute("aria-label", "集めた国の数");
    $("tourBtn").hidden = n < total;
  };
  const openBook = (from) => {
    if (app.dataset.screen === "seq") return;
    bookFrom = from;
    renderBook();
    if (maybeCelebrate("book")) return;
    setScreen("book");
    screens.book.scrollTop = 0;
  };
  const openInfo = (c) => { showCard({ mode: "info", country: c }); };

  /* ひみつの14番目のページ（世界一周したあとだけ、スタンプ帳のいちばん最後に） */
  let revealing = false;
  const secretSlot = () => {
    const open = store.secretRevealed;
    const li = document.createElement("li"); li.className = "secret-li";
    const btn = document.createElement("button");
    btn.type = "button"; btn.className = "stamp-btn secret-btn" + (open ? " open" : "");
    const art = document.createElement("div"); art.className = "stamp-art"; art.innerHTML = A.secretStamp(SECRET, open);
    const tx = document.createElement("div"); tx.className = "secret-txt";
    const k = document.createElement("p"); k.className = "secret-kicker"; k.textContent = "No.14 ― ひみつの旅先";
    const nm = document.createElement("p"); nm.className = "secret-name"; nm.textContent = open ? SECRET.name : "？";
    const cap = document.createElement("p"); cap.className = "secret-cap";
    cap.textContent = open ? SECRET.legend : "世界一周したあなただけの、ひみつの旅先";
    const hint = document.createElement("p"); hint.className = "secret-hint";
    hint.textContent = open ? (store.goldenDrawn ? "押すと、奇跡の大吉のカードをもう一度見られます" : "押すと、北極星の村をもう一度見られます") : "押して、ひみつの旅先を開いてみましょう";
    tx.append(k, nm, cap, hint);
    btn.setAttribute("aria-label", open ? "ひみつの旅先、" + SECRET.name + "のスタンプ。" + hint.textContent : "ひみつの旅先のスタンプ。押すと、世界一周したあなただけの旅先が開きます");
    btn.addEventListener("click", () => { if (revealing) return; if (store.secretRevealed) openSecret(); else revealSecret(); });
    btn.append(art, tx); li.appendChild(btn);
    return li;
  };
  /* ひみつの旅先を見る（黄金のおみくじを引いたあとは、そのカードをまるごと） */
  const openSecret = () => {
    if (store.goldenDrawn) { const res = goldenResult(store.goldenMsg); lastDraw = res; showCard(res); }
    else openInfo(SECRET);
  };
  /* はじめて開くとき：金のスタンプが押されてから、北極星の村のカードへ */
  const revealSecret = () => {
    if (revealing || store.secretRevealed || !tourDone()) return;
    revealing = true;
    Audio.unlock();
    store.secretRevealed = true; saveStore();
    renderBook();
    pressStamp(SECRET, true);
    setTimeout(() => {
      revealing = false;
      if (app.dataset.screen === "book") openSecret();
    }, isCalm() ? 1900 : 2700);
  };

  /* ---------------------------------------------------------------
     13か国の「メリークリスマス」の流れ星
     夜空を、金の尾をひいて1つずつ流れていきます（重ならないよう高さをずらして）。
     ひととおり流れたら少し休んで、こんどはゆっくりくり返します。
     --------------------------------------------------------------- */
  const Meteors = (() => {
    let timer = 0, idx = 0, round = 0, lane = 0;
    const ORDER = [0, 2, 4, 1, 3, 5]; /* 高さの順番（となり合う段が続かないように） */
    const layer = () => $("celeGreets");
    /* 流れる空の範囲：画面の上（右上のボタンの下）から、お祝いの見出しの少し上まで */
    const band = () => {
      const top = 62, title = $("tourTitle").getBoundingClientRect().top;
      return { top, h: Math.min(window.innerHeight * 0.55, title - 58 - 34) - top }; /* 34：流れながら少し下がる分 */
    };
    const spawn = () => {
      const bd = band();
      if (bd.h < 40) return false; /* 下までスクロールしているあいだは、お休み */
      const lanes = Math.max(1, Math.min(6, Math.floor(bd.h / 44) + 1));
      const slot = ORDER.filter((n) => n < lanes)[lane % lanes];
      const c = C[idx % C.length];
      const el = document.createElement("div"); el.className = "meteor";
      const g = document.createElement("span"); g.className = "m-greet" + (isLatin(c.greeting) ? "" : " cjk"); g.textContent = c.greeting;
      const r = document.createElement("span"); r.className = "m-read"; r.textContent = (c.reading ? c.reading + "・" : "") + c.name;
      el.append(g, r);
      el.style.top = Math.round(bd.top + (lanes > 1 ? (bd.h * slot) / (lanes - 1) : 0)) + "px";
      const vw = window.innerWidth;
      const dur = Math.max(4.4, Math.min(7.5, vw / 150 + 1.8)) * (round ? 1.15 : 1);
      el.style.setProperty("--dur", dur.toFixed(2) + "s");
      el.addEventListener("animationend", () => el.remove());
      layer().appendChild(el);
      /* 右上から左下へ、ゆるやかに流れる向きと距離（尾の傾きも合わせます） */
      const dx = vw + el.offsetWidth + 40, dy = Math.round(Math.min(34, bd.h * 0.2 + 12));
      el.style.setProperty("--dx", -dx + "px");
      el.style.setProperty("--dy", dy + "px");
      el.style.setProperty("--ang", (Math.atan2(dy, dx) * 180 / Math.PI).toFixed(1) + "deg");
      setTimeout(() => el.remove(), dur * 1000 + 1500); /* 念のため */
      idx++; lane++;
      return true;
    };
    const tick = () => {
      if (app.dataset.screen !== "celebrate" || isCalm()) { stop(); return; }
      if (!spawn()) { timer = setTimeout(tick, 700); return; }
      let wait = round ? 1500 + Math.random() * 500 : 800 + Math.random() * 400;
      if (idx % C.length === 0) { round++; wait = 3600; } /* 13か国ひとめぐりしたら、ひと休み */
      timer = setTimeout(tick, wait);
    };
    const start = () => { stop(); if (isCalm()) return; idx = 0; round = 0; lane = 0; timer = setTimeout(tick, 900); };
    const stop = () => { clearTimeout(timer); timer = 0; const l = layer(); if (l) l.textContent = ""; };
    return { start, stop };
  })();

  /* ---------------------------------------------------------------
     世界一周のお祝い
     --------------------------------------------------------------- */
  let celeFrom = "book";
  /* 13か国そろって、まだお祝いしていなければお祝いの画面へ */
  const maybeCelebrate = (from) => {
    if (stamps.size >= C.length && !store.celebrated) {
      store.celebrated = true; saveStore();
      openCelebration(from);
      return true;
    }
    return false;
  };
  const openCelebration = (from) => {
    celeFrom = from;
    const W = D.worldTour;
    fill($("tourTitle"), W.title);
    fill($("tourSub"), W.subtitle);
    if (!$("globe").firstChild) $("globe").innerHTML = A.globe();
    const ul = $("tourStamps"); ul.textContent = "";
    C.forEach((c, i) => {
      const li = document.createElement("li");
      li.innerHTML = A.stamp(c, i, { got: true });
      li.style.animationDelay = (0.3 + i * 0.12) + "s";
      li.setAttribute("aria-label", c.name);
      ul.appendChild(li);
    });
    const msg = $("tourMsg"); msg.textContent = "";
    W.message.split("\n").forEach((line) => { const p = document.createElement("p"); p.textContent = line; msg.appendChild(p); });
    const st = $("celeStars"); st.textContent = "";
    if (!isCalm()) {
      for (let i = 0; i < 34; i++) {
        const s = document.createElement("i");
        s.style.left = (Math.random() * 100).toFixed(1) + "%";
        s.style.setProperty("--s", (6 + Math.random() * 14).toFixed(0) + "px");
        s.style.setProperty("--d", (6 + Math.random() * 6).toFixed(1) + "s");
        s.style.setProperty("--dl", (Math.random() * 7).toFixed(1) + "s");
        st.appendChild(s);
      }
    }
    /* 13か国の言葉（動きひかえめのときは、ここに静かに並べます。読み上げにも使われます） */
    const gl = $("greetList"); gl.textContent = "";
    C.forEach((c, i) => {
      const sp = document.createElement("span"); sp.textContent = c.greeting;
      if (i) gl.appendChild(document.createTextNode("　✦　"));
      gl.appendChild(sp);
    });
    setScreen("celebrate");
    screens.celebrate.scrollTop = 0;
    Meteors.start();
    Audio.chime();
    if (W.medley && W.medley.length) Audio.playMedley(W.medley); else Audio.playTune(W.tune, W.bpm);
  };

  /* ---------------------------------------------------------------
     お知らせの窓・トースト
     --------------------------------------------------------------- */
  let toastTimer = 0;
  const toast = (msg, ms) => {
    const t = $("toast");
    t.textContent = msg;
    t.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove("show"), ms || 4200);
  };
  let modalClose = null, modalReturn = null;
  const openModal = (o) => {
    const m = $("modal");
    modalReturn = document.activeElement;
    fill($("modalTitle"), o.title || "");
    fill($("modalText"), o.text || "");
    const img = $("modalImg"); img.hidden = !o.img; if (o.img) img.src = o.img; else img.removeAttribute("src");
    const ta = $("modalArea"); ta.hidden = o.area == null; ta.value = o.area || "";
    const acts = $("modalActions"); acts.textContent = "";
    return new Promise((resolve) => {
      const done = (v) => { m.hidden = true; modalClose = null; if (modalReturn && modalReturn.focus) modalReturn.focus({ preventScroll: true }); resolve(v); };
      (o.buttons || [{ label: "閉じる", value: false }]).forEach((bt, i) => {
        const b = document.createElement("button");
        b.type = "button"; b.className = bt.primary ? "btn-ruby" : "btn-line"; b.textContent = bt.label;
        b.addEventListener("click", () => { if (bt.action) { bt.action(); return; } done(bt.value); });
        acts.appendChild(b);
        if (i === 0) setTimeout(() => b.focus({ preventScroll: true }), 30);
      });
      modalClose = () => done(false);
      m.hidden = false;
      if (o.area != null) setTimeout(() => { ta.focus(); ta.select(); }, 60);
    });
  };
  $("modal").addEventListener("click", (e) => { if (e.target === $("modal") && modalClose) modalClose(); });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape" && modalClose) modalClose(); });

  /* ---------------------------------------------------------------
     友だちに贈る（文章をコピー）
     --------------------------------------------------------------- */
  const giftText = (res) => {
    const c = res.country, L = [];
    L.push("🎄 世界のクリスマス旅おみくじ 🎄", "");
    L.push("✨ あなたへの贈り物：" + res.fortune.name, "");
    if (res.golden) L.push("🌟 世界一周したあなたへの、特別なおみくじ", "");
    L.push(c.flag + " " + (c.secret ? "ひみつの旅先：" + c.name + "（" + c.legend + "）" : "今回の旅先：" + c.name), "");
    L.push(c.greeting);
    if (c.reading) L.push("（" + c.reading + "）");
    L.push("", c.shareLine, "");
    L.push("💌 来年へのひとこと", "", res.message.text, "");
    L.push("🎁 ラッキーアイテム", "", res.lucky.name, "", res.lucky.meaning, "");
    L.push("Merry Christmas！");
    if (D.SHARE_URL) L.push("", D.SHARE_URL);
    return L.join("\n");
  };
  const copyFallback = (text) => {
    openModal({
      title: "贈り物の文章",
      text: "自動でコピーできなかったので、下の文章を選んでコピーしてくださいね。\n（スマートフォンは長押し、パソコンはドラッグで選べます）",
      area: text,
      buttons: [
        { label: "コピーする", primary: true, action: () => {
          const ta = $("modalArea"); ta.focus(); ta.select();
          let ok = false;
          try { ok = document.execCommand && document.execCommand("copy"); } catch (e) { ok = false; }
          if (ok) { $("modal").hidden = true; modalClose = null; toast("クリスマスの贈り物をコピーしました。大切な人に幸せを届けてくださいね。"); }
          else toast("文章を選んだまま、コピーしてくださいね。");
        } },
        { label: "閉じる", value: false }
      ]
    });
  };
  const doGift = () => {
    if (!lastDraw || current !== lastDraw) return;
    const text = giftText(lastDraw);
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(
          () => toast("クリスマスの贈り物をコピーしました。大切な人に幸せを届けてくださいね。", 5200),
          () => copyFallback(text)
        );
      } else copyFallback(text);
    } catch (e) { copyFallback(text); }
  };

  /* ---------------------------------------------------------------
     カードを画像にする（キャンバス）
     --------------------------------------------------------------- */
  const withTimeout = (p, ms, v) => Promise.race([p, new Promise((r) => setTimeout(() => r(v), ms))]);
  const loadImg = (src) => new Promise((resolve, reject) => {
    const im = new Image();
    im.decoding = "async";
    im.onload = () => resolve(im);
    im.onerror = () => reject(new Error("image"));
    im.src = src;
  });
  const loadFonts = async (texts) => {
    if (!document.fonts || !document.fonts.load) return;
    const all = texts.join("");
    const jobs = [
      document.fonts.load('800 40px "Shippori Mincho B1"', all),
      document.fonts.load('700 40px "Shippori Mincho B1"', all),
      document.fonts.load('600 40px "Shippori Mincho B1"', all),
      document.fonts.load('500 40px "Zen Maru Gothic"', all),
      document.fonts.load('700 40px "Zen Maru Gothic"', all),
      document.fonts.load('italic 500 40px "Cormorant Garamond"', all),
      document.fonts.load('40px "Noto Color Emoji"', texts.filter((t) => /\p{Extended_Pictographic}|\p{Regional_Indicator}/u.test(t)).join("") || "🎄")
    ];
    await withTimeout(Promise.allSettled(jobs), 4000);
  };
  const SERIF = '"Shippori Mincho B1","Hiragino Mincho ProN","Yu Mincho",serif';
  const ROUND = '"Zen Maru Gothic","Hiragino Maru Gothic ProN","Yu Gothic",sans-serif';
  const LATIN = '"Cormorant Garamond","Shippori Mincho B1",serif';
  const EMOJI = '"Noto Color Emoji","Apple Color Emoji","Segoe UI Emoji",sans-serif';
  const NO_START = "、。，．・：；？！ー―…‥）」』】〉》〕］｝〙〗’”ぁぃぅぇぉっゃゅょゎァィゥェォッャュョヮヵヶ";
  /* 日本語の折り返し（行頭に句読点が来ないように） */
  const wrap = (ctx, text, maxW) => {
    const lines = [];
    text.split("\n").forEach((para) => {
      let line = "";
      const chars = [...para];
      for (let i = 0; i < chars.length; i++) {
        const ch = chars[i];
        const test = line + ch;
        if (ctx.measureText(test).width > maxW && line && !NO_START.includes(ch)) {
          lines.push(line); line = ch;
        } else line = test;
      }
      if (line) lines.push(line);
    });
    return lines;
  };
  const roundRect = (ctx, x, y, w, h, r) => {
    ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
  };
  const centerText = (ctx, text, y, font, color) => { ctx.font = font; ctx.fillStyle = color; ctx.textAlign = "center"; ctx.fillText(text, 543, y); };

  const renderCardCanvas = async (res) => {
    const c = res.country, f = res.fortune, L = res.lucky;
    await loadFonts([f.name, f.theme, c.name, c.nameEn, c.city, c.cityEn, c.legend || "", res.message.text, L.name, L.meaning, c.flag, "世界のクリスマス旅おみくじ ― ・（）世界一周したあなたへ"]);
    const W = 1086, H = 1448;
    const cv = document.createElement("canvas"); cv.width = W; cv.height = H;
    const ctx = cv.getContext("2d");
    const frame = await loadImg("images/card-frame.webp");
    ctx.drawImage(frame, 0, 0, W, H);
    ctx.textBaseline = "alphabetic";

    let y = 214;
    /* 奇跡の大吉は、シンボルを少し小さくして上に添え書きを入れます */
    const symS = res.golden ? 84 : 100, symY = res.golden ? 238 : y;
    try { const sym = await loadImg(A.toDataUrl(A.fortuneSymbol(f.symbol))); ctx.drawImage(sym, 543 - symS / 2, symY, symS, symS); } catch (e) { /* シンボルなしでも続けます */ }
    y += 156;
    if (res.golden) {
      centerText(ctx, "世界一周したあなたへ", 230, "700 19px " + ROUND, "#9a6c1c");
      const gr = ctx.createLinearGradient(0, y - 50, 0, y + 6);
      gr.addColorStop(0, "#c99a3a"); gr.addColorStop(0.5, "#9a6a14"); gr.addColorStop(1, "#7a520e");
      centerText(ctx, f.name, y, "800 54px " + SERIF, gr);
    } else centerText(ctx, f.name, y, "800 54px " + SERIF, "#9e1f30");
    y += 40;
    centerText(ctx, "― " + f.theme + " ―", y, "600 25px " + SERIF, "#7c5a22");
    y += 24;
    try { const dv = await loadImg(A.toDataUrl(A.divider())); ctx.drawImage(dv, 543 - 160, y, 320, 22); } catch (e) { /* なにもしない */ }
    y += 70;
    /* 国旗＋国名 */
    ctx.font = "800 44px " + SERIF;
    const nameW = ctx.measureText(c.name).width;
    ctx.font = "44px " + EMOJI;
    const flagW = ctx.measureText(c.flag).width;
    const startX = 543 - (flagW + 14 + nameW) / 2;
    ctx.textAlign = "left";
    ctx.fillStyle = c.secret ? "#b4862c" : "#2b2016";
    ctx.fillText(c.flag, startX, y);
    ctx.fillStyle = "#2b2016";
    ctx.font = "800 44px " + SERIF;
    ctx.fillText(c.name, startX + flagW + 14, y);
    y += 38;
    centerText(ctx, c.secret ? c.legend : c.city + "　·　" + c.cityEn + "　·　" + c.nameEn, y, (c.secret ? "600 22px " + SERIF : "italic 500 25px " + LATIN), "#7a5a32");
    y += 22;
    /* 風景 */
    /* 奇跡の大吉は「来年へのひとこと」が長いので、風景を少し小さくして文章の場所を広げます */
    const lh = res.golden ? 285 : 330, lw = Math.round(lh * 4 / 3), lx = 543 - lw / 2;
    ctx.save();
    ctx.shadowColor = "rgba(60,40,10,.3)"; ctx.shadowBlur = 16; ctx.shadowOffsetY = 6;
    roundRect(ctx, lx - 7, y - 7, lw + 14, lh + 14, 18); ctx.fillStyle = "#fbf6ea"; ctx.fill();
    ctx.restore();
    ctx.save();
    roundRect(ctx, lx, y, lw, lh, 12); ctx.clip();
    let drew = false;
    if (c.image) {
      try {
        const im = await loadImg(c.image);
        const s = Math.max(lw / im.naturalWidth, lh / im.naturalHeight);
        const dw = im.naturalWidth * s, dh = im.naturalHeight * s;
        ctx.drawImage(im, lx + (lw - dw) / 2, y + (lh - dh) / 2, dw, dh); drew = true;
      } catch (e) { drew = false; }
    }
    if (!drew) { try { const pc = await loadImg(A.toDataUrl(A.postcard(c))); ctx.drawImage(pc, lx, y, lw, lh); } catch (e) { ctx.fillStyle = "#0c1a3e"; ctx.fillRect(lx, y, lw, lh); } }
    ctx.restore();
    roundRect(ctx, lx, y, lw, lh, 12); ctx.lineWidth = 2.5; ctx.strokeStyle = "#c9a24a"; ctx.stroke();
    y += lh + 44;
    centerText(ctx, "― 来年へのひとこと ―", y, "700 19px " + ROUND, "#9a6c1c");
    y += 14;
    /* メッセージ（長さに合わせて文字の大きさを調整） */
    let fs = 27, lines, lhgt;
    const msgMaxH = res.golden ? 265 : 220;
    for (;;) {
      ctx.font = "600 " + fs + "px " + SERIF;
      lines = wrap(ctx, res.message.text, 690);
      lhgt = Math.round(fs * 1.62);
      /* 最後の行がラッキーアイテム（アイコンの上端）にかからない大きさまで小さくします */
      if ((lines.length <= 4 && lines.length * lhgt <= msgMaxH) || lhgt * 0.8 + (lines.length - 1) * lhgt <= msgMaxH - 52 || fs <= 18) break;
      fs -= 1;
    }
    ctx.fillStyle = "#2e2218"; ctx.textAlign = "left";
    const blockH = lines.length * lhgt;
    let my = y + Math.max(lhgt * 0.8, (msgMaxH - blockH) / 2 + lhgt * 0.4);
    lines.forEach((ln) => { ctx.fillText(ln, 543 - 345, my); my += lhgt; });
    y += msgMaxH + 6;
    /* ラッキーアイテム */
    ctx.font = "700 27px " + SERIF;
    const lab = "ラッキーアイテム：" + L.name;
    const labW = ctx.measureText(lab).width;
    const iconS = 58;
    const lx2 = 543 - (iconS + 12 + labW) / 2;
    try { const ic = await loadImg(A.toDataUrl(A.luckyIcon(L.icon))); ctx.drawImage(ic, lx2, y - 44, iconS, iconS); } catch (e) { /* なにもしない */ }
    ctx.fillStyle = "#1e6a4e"; ctx.textAlign = "left"; ctx.fillText(lab, lx2 + iconS + 12, y);
    y += 40;
    ctx.font = "500 21px " + ROUND;
    const ml = wrap(ctx, L.meaning, 470);
    ml.forEach((ln) => { centerText(ctx, ln, y, "500 21px " + ROUND, "#5a4632"); y += 32; });
    return cv;
  };

  const renderTourCanvas = async () => {
    const T = D.worldTour;
    await loadFonts([T.title, T.subtitle, T.message, C.map((c) => c.name).join(""), "世界のクリスマス旅おみくじ"]);
    const W = 1086, H = 1448;
    const cv = document.createElement("canvas"); cv.width = W; cv.height = H;
    const ctx = cv.getContext("2d");
    ctx.drawImage(await loadImg("images/card-frame.webp"), 0, 0, W, H);
    let y = 226;
    try { const gl = await loadImg(A.toDataUrl(A.globe())); ctx.drawImage(gl, 543 - 62, y, 124, 124); } catch (e) { /* なにもしない */ }
    y += 186;
    centerText(ctx, T.title, y, "800 52px " + SERIF, "#9e1f30");
    y += 44;
    ctx.font = "600 23px " + SERIF;
    wrap(ctx, T.subtitle, 640).forEach((ln) => { centerText(ctx, ln, y, "600 23px " + SERIF, "#6a4a22"); y += 34; });
    y += 6;
    /* 13か国のスタンプ（5・4・4 の3段） */
    const rows = [], per = [5, 4, 4];
    let k = 0; per.forEach((n) => { rows.push(C.slice(k, k + n)); k += n; });
    if (k < C.length) rows.push(C.slice(k));
    const cell = 118;
    for (const row of rows) {
      const rx = 543 - (row.length * cell) / 2;
      for (let i = 0; i < row.length; i++) {
        const c = row[i], idx = C.indexOf(c);
        try { const st = await loadImg(A.toDataUrl(A.stamp(c, idx, { got: true, text: false }))); ctx.drawImage(st, rx + i * cell + 9, y, 100, 100); } catch (e) { /* なにもしない */ }
        ctx.font = "700 17px " + ROUND; ctx.fillStyle = "#4a3020"; ctx.textAlign = "center";
        ctx.fillText(c.name, rx + i * cell + cell / 2, y + 120);
      }
      y += 138;
    }
    y += 26;
    let fs = 22, lines;
    for (;;) {
      ctx.font = "600 " + fs + "px " + SERIF;
      lines = wrap(ctx, T.message, 660);
      if (lines.length * fs * 1.6 + T.message.split("\n").length * fs * 0.35 <= 1240 - y || fs <= 16) break;
      fs -= 1;
    }
    ctx.fillStyle = "#2e2218"; ctx.textAlign = "left";
    T.message.split("\n").forEach((para) => {
      wrap(ctx, para, 660).forEach((ln) => { ctx.fillText(ln, 543 - 330, y); y += fs * 1.6; });
      y += fs * 0.35;
    });
    return cv;
  };

  /* 保存：アプリの「ダウンロード」機能 → 使えないときは画像を表示して長押し保存 */
  let dlPromise = null;
  const getDownloads = () => {
    if (!dlPromise) {
      dlPromise = (async () => {
        try {
          if (!(window.claude && typeof window.claude.use === "function")) return null;
          return await withTimeout(Promise.resolve(window.claude.use("downloads")), 2500, null);
        } catch (e) { return null; }
      })();
    }
    return dlPromise;
  };
  const showImageFallback = (url) => openModal({
    title: "カードの画像",
    text: "画像を長押し（パソコンは右クリック）して保存してください。",
    img: url,
    buttons: [{ label: "閉じる", value: false }]
  });
  const saveCanvas = async (cv, filename) => {
    const blob = await new Promise((r) => { try { cv.toBlob(r, "image/png"); } catch (e) { r(null); } });
    const dl = await getDownloads();
    if (dl && typeof dl.save === "function" && blob) {
      try {
        await dl.save({ filename, data: blob });
        toast("カードを保存しました。大切な人にも贈ってみてくださいね。");
        return;
      } catch (e) {
        const code = String((e && (e.code || e.name || e.message)) || "");
        if (/declin|denied|cancel|abort|dismiss/i.test(code)) { toast("保存をやめました。"); return; }
      }
    }
    let url = "";
    try { url = cv.toDataURL("image/png"); } catch (e) { url = ""; }
    if (url) showImageFallback(url);
    else toast("ごめんなさい、この端末では画像を作れませんでした。画面の写真（スクリーンショット）で残してくださいね。", 6000);
  };
  let saving = false;
  const saveWith = async (render, filename) => {
    if (saving) return;
    saving = true;
    toast("カードを準備しています…", 2500);
    try { const cv = await render(); await saveCanvas(cv, filename); }
    catch (e) { toast("ごめんなさい、画像を作れませんでした。もう一度お試しください。"); }
    finally { saving = false; }
  };

  /* ---------------------------------------------------------------
     音・動きの切りかえ
     --------------------------------------------------------------- */
  const applySoundUI = () => {
    const b = $("soundBtn");
    b.setAttribute("aria-pressed", String(prefs.sound));
    b.setAttribute("aria-label", prefs.sound ? "音：オン（押すとオフ）" : "音：オフ（押すとオン）");
    fill($("soundLabel"), prefs.sound ? "音オン" : "音オフ");
  };
  const applyCalm = () => {
    const calm = isCalm();
    document.body.classList.toggle("calm", calm);
    $("motionBtn").setAttribute("aria-pressed", String(!!prefs.calm));
    if (calm) FX.stop(); else FX.start();
    if (app.dataset.screen === "celebrate") { if (calm) Meteors.stop(); else Meteors.start(); }
  };

  /* ---------------------------------------------------------------
     ボタンのつなぎこみ
     --------------------------------------------------------------- */
  const bindings = () => {
    $("openBtn").addEventListener("click", startJourney);
    $("skipBtn").addEventListener("click", finishJourney);
    $("bookBtnStart").addEventListener("click", () => openBook("start"));
    $("bookBtnResult").addEventListener("click", () => openBook("result"));
    $("againBtn").addEventListener("click", () => {
      if (busy) return;
      goHome();
      busy = true; $("openBtn").disabled = true;
      setTimeout(() => { busy = false; $("openBtn").disabled = false; startJourney(); }, isCalm() ? 300 : 1300);
    });
    $("giftBtn").addEventListener("click", doGift);
    $("saveBtn").addEventListener("click", () => { if (lastDraw) saveWith(() => renderCardCanvas(lastDraw), "christmas-card.png"); });
    $("homeBtn").addEventListener("click", goHome);
    $("homeBtn2").addEventListener("click", goHome);
    $("backToBook").addEventListener("click", () => openBook(bookFrom));
    $("prevPage").addEventListener("click", () => goPage(pageIdx - 1));
    $("nextPage").addEventListener("click", () => goPage(pageIdx + 1));
    $("bookBack").addEventListener("click", () => {
      if (bookFrom === "result" && lastDraw) showCard(lastDraw, { music: false });
      else goHome();
    });
    $("bookHome").addEventListener("click", goHome);
    $("tourBtn").addEventListener("click", () => openCelebration("book"));
    $("tourClose").addEventListener("click", () => {
      if (celeFrom === "result" && lastDraw) showCard(lastDraw, { music: false });
      else if (celeFrom === "start") goHome();
      else openBook(bookFrom);
    });
    $("tourSave").addEventListener("click", () => saveWith(renderTourCanvas, "world-tour-card.png"));
    $("resetBtn").addEventListener("click", async () => {
      const ok = await openModal({
        title: "スタンプ帳を最初からやり直しますか？",
        text: "集めたスタンプがすべて消えて、元にはもどせません。",
        buttons: [{ label: "やめる", value: false }, { label: "最初からやり直す", value: true, primary: true }]
      });
      if (!ok) return;
      stamps.clear(); store.celebrated = false;
      store.goldenDrawn = false; store.secretRevealed = false; store.goldenMsg = -1;
      saveStore(); renderBook(); updateStartState();
      toast("スタンプ帳を新しくしました。また世界のクリスマスへ出かけましょう。");
    });
    $("soundBtn").addEventListener("click", () => {
      prefs.sound = !prefs.sound;
      writeJSON(PREF_KEY, prefs);
      applySoundUI();
      if (prefs.sound) Audio.unlock(); else Audio.allOff();
    });
    $("motionBtn").addEventListener("click", () => {
      prefs.calm = !prefs.calm;
      writeJSON(PREF_KEY, prefs);
      applyCalm();
      toast(prefs.calm ? "動きをひかえめにしました。" : "動きをもとにもどしました。", 2400);
    });
    if (mq.addEventListener) mq.addEventListener("change", applyCalm);

    /* 最初のタップで、やさしいオルゴールの音楽が始まります */
    const firstTouch = (e) => {
      if (e && e.target && e.target.closest && e.target.closest("#soundBtn")) return;
      if (prefs.sound) Audio.unlock();
    };
    ["pointerup", "keydown", "touchend"].forEach((ev) => document.addEventListener(ev, firstTouch, { passive: true }));

    document.addEventListener("visibilitychange", () => { if (document.hidden) Audio.suspend(); else Audio.resume(); });
    let rz = 0;
    const onResize = () => {
      cancelAnimationFrame(rz);
      rz = requestAnimationFrame(() => {
        layout();
        if (app.dataset.screen === "result") { pagesEl.style.scrollBehavior = "auto"; pagesEl.scrollLeft = pageIdx * pagesEl.clientWidth; pagesEl.style.scrollBehavior = ""; }
      });
    };
    window.addEventListener("resize", onResize);
    if (window.visualViewport) window.visualViewport.addEventListener("resize", onResize);
  };

  /* ---------------------------------------------------------------
     はじまり
     --------------------------------------------------------------- */
  const init = () => {
    buildLights();
    const dv = "url(\"" + A.toDataUrl(A.divider()) + "\")";
    document.querySelectorAll(".divider").forEach((d) => { d.style.backgroundImage = dv; });
    layout();
    applySoundUI();
    applyCalm();
    FX.setMode("idle");
    bindings();
    setScreen("start");
    updateStartState();
  };


  init();
})();
