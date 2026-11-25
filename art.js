/* =====================================================================
   art.js ― アプリの中で使うオリジナルのイラスト（SVG）を描く部分
   運勢のシンボル、ラッキーアイテム、スタンプ、絵はがき風の風景、地球儀。
   ふつうは書きかえる必要はありません。
   ===================================================================== */
window.XMAS_ART = (function () {
  "use strict";

  let uidN = 0;
  const uid = (p) => p + "_" + (++uidN).toString(36);
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  /* 小さな乱数（国ごとに同じ絵になるように） */
  const rngFrom = (str) => {
    let h = 1779033703 ^ str.length;
    for (let i = 0; i < str.length; i++) { h = Math.imul(h ^ str.charCodeAt(i), 3432918353); h = (h << 13) | (h >>> 19); }
    let a = h >>> 0;
    return () => {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  };
  const f1 = (n) => Math.round(n * 10) / 10;

  const GOLD = "#b4862c", GOLD_D = "#8a6420", GOLD_L = "#e9c877", RUBY = "#9e1f30", EMER = "#1e6a4e", PEARL = "#fbf6ea";

  /* 金のグラデーション（id は毎回ちがう名前にする） */
  const goldGrad = (id, light) => `<linearGradient id="${id}" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0" stop-color="${light ? "#fff2c2" : "#f3d98f"}"/><stop offset=".5" stop-color="${light ? "#f0c968" : "#d1a443"}"/><stop offset="1" stop-color="${light ? "#c99434" : "#9c7125"}"/></linearGradient>`;

  /* 星形の点列 */
  const starPts = (cx, cy, n, R, r, rot) => {
    const pts = [];
    for (let i = 0; i < n * 2; i++) {
      const a = (rot || -Math.PI / 2) + (i * Math.PI) / n;
      const rr = i % 2 ? r : R;
      pts.push(f1(cx + Math.cos(a) * rr) + "," + f1(cy + Math.sin(a) * rr));
    }
    return pts.join(" ");
  };
  const sparkle = (x, y, s, fill) =>
    `<path d="M${x} ${y - s}Q${x + s * .18} ${y - s * .18} ${x + s} ${y}Q${x + s * .18} ${y + s * .18} ${x} ${y + s}Q${x - s * .18} ${y + s * .18} ${x - s} ${y}Q${x - s * .18} ${y - s * .18} ${x} ${y - s}Z" fill="${fill}"/>`;

  /* ============ ① 運勢のシンボル（100×100） ============ */
  const fortuneSymbol = (kind, opts) => {
    const o = opts || {};
    const g = uid("fg");
    const light = !!o.light; // 暗い背景用
    const st = light ? "#f6dc93" : GOLD_D;
    let body = "";
    if (kind === "star") {
      body = `<polygon points="${starPts(50, 50, 4, 40, 9)}" fill="url(#${g})" stroke="${st}" stroke-width="1.2" stroke-linejoin="round"/>
        <polygon points="${starPts(50, 50, 4, 24, 7, -Math.PI / 4)}" fill="url(#${g})" stroke="${st}" stroke-width="1" opacity=".9"/>
        <circle cx="50" cy="50" r="5.5" fill="${PEARL}" stroke="${st}" stroke-width="1.2"/>
        <circle cx="50" cy="50" r="30" fill="none" stroke="${st}" stroke-width=".8" stroke-dasharray="1.5 3.5" opacity=".8"/>
        ${sparkle(82, 20, 5, `url(#${g})`)}${sparkle(18, 78, 4, `url(#${g})`)}${sparkle(84, 78, 3, `url(#${g})`)}`;
    } else if (kind === "angel") {
      const wing = `M48 60C44 44 32 30 10 26C14 33 17 38 22 42C15 43 11 47 9 52C17 51 23 52 28 55C22 58 19 62 18 67C26 64 33 63 38 65C35 69 34 73 35 78C42 72 46 67 48 60Z`;
      body = `<ellipse cx="50" cy="24" rx="15" ry="5" fill="none" stroke="url(#${g})" stroke-width="3.2"/>
        <ellipse cx="50" cy="24" rx="15" ry="5" fill="none" stroke="${st}" stroke-width=".8"/>
        <path d="${wing}" fill="url(#${g})" stroke="${st}" stroke-width="1.1" stroke-linejoin="round"/>
        <path d="${wing}" transform="translate(100 0) scale(-1 1)" fill="url(#${g})" stroke="${st}" stroke-width="1.1" stroke-linejoin="round"/>
        <path d="M44 56C36 46 26 38 16 32M42 62C34 56 26 52 16 51M42 66C36 64 30 64 24 66M56 56C64 46 74 38 84 32M58 62C66 56 74 52 84 51M58 66C64 64 70 64 76 66" fill="none" stroke="${st}" stroke-width=".7" opacity=".75"/>
        <path d="M50 44L53 52L50 60L47 52Z" fill="${PEARL}" stroke="${st}" stroke-width="1"/>
        ${sparkle(50, 84, 4.5, `url(#${g})`)}`;
    } else if (kind === "bell") {
      body = `<path d="M50 22C37 22 30 33 30 47C30 59 26 65 19 71H81C74 65 70 59 70 47C70 33 63 22 50 22Z" fill="url(#${g})" stroke="${st}" stroke-width="1.3" stroke-linejoin="round"/>
        <path d="M19 71H81L79 76H21Z" fill="url(#${g})" stroke="${st}" stroke-width="1.1"/>
        <path d="M36 46C37 36 42 30 49 28" fill="none" stroke="#fff6d6" stroke-width="2" stroke-linecap="round" opacity=".8"/>
        <path d="M28 62Q50 56 72 62" fill="none" stroke="${st}" stroke-width=".8"/>
        <circle cx="50" cy="82" r="5" fill="url(#${g})" stroke="${st}" stroke-width="1.1"/>
        <path d="M50 22C43 12 34 12 36 18C38 22 46 22 50 22C54 22 62 22 64 18C66 12 57 12 50 22Z" fill="${RUBY}" stroke="#6d1220" stroke-width="1"/>
        <circle cx="50" cy="21" r="3" fill="${RUBY}" stroke="#6d1220" stroke-width="1"/>
        <path d="M60 30c5-6 12-4 13 1c-5 0-8 3-9 7c-3-3-5-5-4-8z" fill="${EMER}" stroke="#123f2e" stroke-width=".8"/>
        <circle cx="62" cy="33" r="2.6" fill="#c8323c"/><circle cx="66" cy="35" r="2.3" fill="#c8323c"/>`;
    } else if (kind === "holynight") {
      body = `<path d="M30 18A16 16 0 1 0 44 40A12.5 12.5 0 1 1 30 18Z" fill="url(#${g})" stroke="${st}" stroke-width="1.1"/>
        <rect x="52" y="44" width="16" height="40" rx="2" fill="${PEARL}" stroke="${st}" stroke-width="1.3"/>
        <path d="M52 50H68" stroke="${st}" stroke-width=".8"/>
        <path d="M60 22C66 30 66 36 60 40C54 36 54 30 60 22Z" fill="url(#${g})" stroke="${st}" stroke-width="1"/>
        <path d="M60 30C62 33 62 36 60 38C58 36 58 33 60 30Z" fill="#fff8de"/>
        <line x1="60" y1="40" x2="60" y2="44" stroke="${st}" stroke-width="1.2"/>
        <ellipse cx="60" cy="86" rx="20" ry="4.5" fill="url(#${g})" stroke="${st}" stroke-width="1.1"/>
        <path d="M40 84c-6-5-12-3-13 2c5 0 8 2 9 5c2-3 4-5 4-7z" fill="${EMER}" stroke="#123f2e" stroke-width=".8"/>
        <circle cx="42" cy="86" r="2.6" fill="#c8323c"/>
        ${sparkle(80, 18, 4.5, `url(#${g})`)}${sparkle(86, 40, 3, `url(#${g})`)}${sparkle(18, 56, 3, `url(#${g})`)}`;
    } else if (kind === "miracle") {
      /* 奇跡の大吉：光の冠をいただいた、八つの光の星（細い線の光線つき） */
      let rays = "";
      for (let i = 0; i < 16; i++) {
        const a = (i * Math.PI) / 8 + Math.PI / 16, r0 = 33, r1 = i % 2 ? 40 : 45;
        rays += `<line x1="${f1(50 + Math.cos(a) * r0)}" y1="${f1(58 + Math.sin(a) * r0)}" x2="${f1(50 + Math.cos(a) * r1)}" y2="${f1(58 + Math.sin(a) * r1)}" stroke="${st}" stroke-width=".7" stroke-linecap="round" opacity=".75"/>`;
      }
      body = `<circle cx="50" cy="58" r="29" fill="none" stroke="${st}" stroke-width=".6" stroke-dasharray="1 3" opacity=".7"/>${rays}
        <polygon points="${starPts(50, 58, 8, 27, 10)}" fill="url(#${g})" stroke="${st}" stroke-width="1.1" stroke-linejoin="round"/>
        <polygon points="${starPts(50, 58, 4, 15, 5, -Math.PI / 4)}" fill="#fff6d6" fill-opacity=".55" stroke="${st}" stroke-width=".7"/>
        <circle cx="50" cy="58" r="4.2" fill="${PEARL}" stroke="${st}" stroke-width="1"/>
        <path d="M37 22L39.5 12L44.5 18L50 8L55.5 18L60.5 12L63 22Q50 18.5 37 22Z" fill="url(#${g})" fill-opacity=".9" stroke="${st}" stroke-width=".9" stroke-linejoin="round"/>
        <circle cx="39.5" cy="11" r="1.5" fill="${PEARL}" stroke="${st}" stroke-width=".6"/><circle cx="50" cy="6.6" r="1.8" fill="${PEARL}" stroke="${st}" stroke-width=".6"/><circle cx="60.5" cy="11" r="1.5" fill="${PEARL}" stroke="${st}" stroke-width=".6"/>
        ${sparkle(15, 30, 4, `url(#${g})`)}${sparkle(86, 34, 3.4, `url(#${g})`)}${sparkle(84, 88, 3, `url(#${g})`)}${sparkle(16, 86, 2.6, `url(#${g})`)}`;
    } else { /* snow */
      let arms = "";
      for (let i = 0; i < 6; i++) {
        arms += `<g transform="rotate(${i * 60} 50 50)"><path d="M50 50V12M50 22L43 15M50 22L57 15M50 32L41 25M50 32L59 25M50 42L45 38M50 42L55 38" fill="none" stroke="url(#${g})" stroke-width="3.4" stroke-linecap="round"/>
          <path d="M50 50V12M50 22L43 15M50 22L57 15M50 32L41 25M50 32L59 25" fill="none" stroke="${st}" stroke-width=".7" stroke-linecap="round" opacity=".7"/><circle cx="50" cy="11" r="2.4" fill="${PEARL}" stroke="${st}" stroke-width=".8"/></g>`;
      }
      body = arms + `<polygon points="${starPts(50, 50, 6, 8, 5, 0)}" fill="${PEARL}" stroke="${st}" stroke-width="1"/>`;
    }
    return `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><defs>${goldGrad(g, light)}</defs>${body}</svg>`;
  };

  /* ============ ② ラッキーアイテム（64×64） ============ */
  const luckyIcon = (kind) => {
    const g = uid("lg");
    const S = `stroke="${GOLD_D}" stroke-width="1.4" stroke-linejoin="round" stroke-linecap="round"`;
    const s = `stroke="${GOLD_D}" stroke-width="1" stroke-linecap="round"`;
    const G = `url(#${g})`;
    let b = "";
    switch (kind) {
      case "starPendant":
        b = `<path d="M10 8Q32 34 54 8" fill="none" ${s} stroke-dasharray="1.5 2.2"/><circle cx="32" cy="22" r="2" fill="none" ${s}/>
          <polygon points="${starPts(32, 38, 5, 15, 6.5)}" fill="${G}" ${S}/><circle cx="32" cy="38" r="2.4" fill="${PEARL}" ${s}/>`; break;
      case "candle":
        b = `<rect x="24" y="26" width="16" height="28" rx="2" fill="${PEARL}" ${S}/><path d="M24 31H40" ${s}/>
          <path d="M32 8C38 15 38 20 32 23C26 20 26 15 32 8Z" fill="${G}" ${S}/><line x1="32" y1="23" x2="32" y2="26" ${s}/>
          <ellipse cx="32" cy="56" rx="17" ry="3.5" fill="${G}" ${S}/>
          <path d="M14 54c-4-4-9-2-9 2c4 0 6 1 7 4c1-2 2-4 2-6z" fill="${EMER}" stroke="#123f2e" stroke-width=".8"/><circle cx="16" cy="55" r="2.2" fill="#c8323c"/>`; break;
      case "postcard":
        b = `<g transform="rotate(-8 32 32)"><rect x="8" y="16" width="48" height="32" rx="2" fill="${PEARL}" ${S}/>
          <rect x="42" y="20" width="10" height="12" fill="${RUBY}" opacity=".85" ${s}/><path d="M32 20V44" ${s}/>
          <path d="M12 26H28M12 32H28M12 38H24M36 36H52M36 41H52" ${s}/></g>`; break;
      case "ribbon":
        b = `<path d="M32 30C22 16 8 18 10 28C12 36 26 34 32 30Z" fill="${RUBY}" stroke="#5e1020" stroke-width="1.2"/>
          <path d="M32 30C42 16 56 18 54 28C52 36 38 34 32 30Z" fill="${RUBY}" stroke="#5e1020" stroke-width="1.2"/>
          <path d="M30 32L20 54L26 52L29 57L32 34Z M34 32L44 54L38 52L35 57L32 34Z" fill="#b8283a" stroke="#5e1020" stroke-width="1.1" stroke-linejoin="round"/>
          <ellipse cx="32" cy="30" rx="4.5" ry="5" fill="${G}" ${S}/>`; break;
      case "mug":
        b = `<path d="M14 24H44V48C44 53 40 56 35 56H23C18 56 14 53 14 48Z" fill="${PEARL}" ${S}/>
          <path d="M44 29C53 29 53 45 44 45" fill="none" ${S}/>
          <path d="M29 44C22 39 23 33 27 33C29 33 29 35 29 35C29 35 29 33 31 33C35 33 36 39 29 44Z" fill="${RUBY}"/>
          <path d="M22 18C20 14 24 12 22 8M30 18C28 14 32 12 30 8M38 18C36 14 40 12 38 8" fill="none" ${s} opacity=".7"/>`; break;
      case "notebook":
        b = `<rect x="14" y="10" width="34" height="46" rx="3" fill="${EMER}" stroke="#123f2e" stroke-width="1.3"/>
          <rect x="18" y="14" width="26" height="38" rx="1.5" fill="none" stroke="${GOLD_L}" stroke-width="1"/>
          <polygon points="${starPts(31, 30, 4, 7, 2.4)}" fill="${G}"/>
          <path d="M40 10V62L43 58L46 62V10" fill="${RUBY}" stroke="#5e1020" stroke-width=".9"/>
          <path d="M48 14V52" stroke="${PEARL}" stroke-width="2.5"/>`; break;
      case "snowglobe":
        b = `<circle cx="32" cy="27" r="19" fill="#dfeaf7" fill-opacity=".55" ${S}/>
          <path d="M32 14L39 28H35L41 38H23L29 28H25Z" fill="${EMER}" stroke="#123f2e" stroke-width=".8"/>
          <path d="M14 38Q32 46 50 38" fill="#fff" stroke="none" opacity=".9"/>
          <circle cx="22" cy="20" r="1.2" fill="#fff"/><circle cx="42" cy="18" r="1.2" fill="#fff"/><circle cx="40" cy="30" r="1" fill="#fff"/>
          <path d="M18 44H46L50 56H14Z" fill="${G}" ${S}/>
          <path d="M24 22a10 10 0 0 1 8-6" fill="none" stroke="#fff" stroke-width="1.6" stroke-linecap="round" opacity=".8"/>`; break;
      case "musicbox":
        b = `<path d="M10 30L32 24L54 30V50L32 56L10 50Z" fill="${RUBY}" stroke="#5e1020" stroke-width="1.2" stroke-linejoin="round"/>
          <path d="M10 30L32 36L54 30M32 36V56" fill="none" stroke="${GOLD_L}" stroke-width="1"/>
          <path d="M10 30L18 12L40 6L54 30" fill="#f6ecd2" fill-opacity=".9" ${S}/>
          <path d="M44 14V4L52 2V12" fill="none" ${s}/><ellipse cx="42" cy="14" rx="2.6" ry="2" fill="${G}"/><ellipse cx="50" cy="12" rx="2.6" ry="2" fill="${G}"/>
          <path d="M18 42l4 1M18 46l4 1M40 43l4-1M40 47l4-1" stroke="${GOLD_L}" stroke-width="1"/>`; break;
      case "teacup":
        b = `<path d="M14 28H46C46 40 40 48 30 48C20 48 14 40 14 28Z" fill="${PEARL}" ${S}/>
          <path d="M46 31C54 31 53 41 44 40" fill="none" ${S}/>
          <ellipse cx="30" cy="52" rx="22" ry="4.5" fill="${G}" ${S}/>
          <path d="M20 33Q30 38 40 33" fill="none" stroke="${RUBY}" stroke-width="1.2"/>
          <path d="M24 22C22 18 26 16 24 12M32 22C30 18 34 16 32 12" fill="none" ${s} opacity=".7"/>`; break;
      case "flower": {
        let p = "";
        for (let i = 0; i < 5; i++) p += `<ellipse cx="32" cy="18" rx="7.5" ry="11" transform="rotate(${i * 72} 32 30)" fill="#fffdf6" ${S}/>`;
        b = `<path d="M30 42C26 50 20 54 12 56M33 42C38 50 44 52 52 54" fill="none" stroke="${EMER}" stroke-width="1.6"/>
          <path d="M18 54c-2-6 2-10 8-8c-2 4-4 7-8 8z" fill="${EMER}"/><path d="M46 53c2-6-2-10-8-8c2 4 4 7 8 8z" fill="${EMER}"/>
          ${p}<circle cx="32" cy="30" r="4.5" fill="${G}" ${s}/>`; break; }
      case "ornament":
        b = `<path d="M32 4V12" ${s}/><path d="M28 4Q32 0 36 4" fill="none" ${s}/>
          <rect x="27" y="11" width="10" height="6" rx="1.2" fill="${G}" ${S}/>
          <circle cx="32" cy="38" r="21" fill="#1f5c86" fill-opacity=".85" ${S}/>
          <path d="M12 34Q32 42 52 34M12 42Q32 50 52 42" fill="none" stroke="${GOLD_L}" stroke-width="1.3"/>
          <polygon points="${starPts(32, 38, 4, 5, 1.8)}" fill="${GOLD_L}"/>
          <path d="M20 26a14 14 0 0 1 9-7" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" opacity=".7"/>`; break;
      case "pearl": {
        let p = "";
        for (let i = 0; i <= 10; i++) {
          const a = Math.PI * (0.1 + 0.8 * i / 10);
          p += `<circle cx="${f1(32 - Math.cos(a) * 24)}" cy="${f1(14 + Math.sin(a) * 30)}" r="${i === 5 ? 5 : 3.6}" fill="#fffaf0" ${s}/>`;
        }
        b = `<path d="M6 10Q32 52 58 10" fill="none" ${s} opacity=".5"/>${p}<circle cx="32" cy="50" r="1.6" fill="#fff"/>`; break; }
      case "stole":
        b = `<path d="M12 12C24 8 40 8 52 12L48 34C40 30 24 30 16 34Z" fill="${RUBY}" stroke="#5e1020" stroke-width="1.2" stroke-linejoin="round"/>
          <path d="M16 34C14 42 18 48 22 54L32 52C28 46 26 40 28 32Z" fill="#b8283a" stroke="#5e1020" stroke-width="1.1"/>
          <path d="M14 18C26 14 38 14 50 18M14 24C26 20 38 20 49 24" fill="none" stroke="${GOLD_L}" stroke-width="1"/>
          <path d="M22 54l-1 5M25 54l0 5M28 53l1 5M31 52l1 5" ${s}/>`; break;
      case "letter":
        b = `<rect x="8" y="16" width="48" height="32" rx="2" fill="${PEARL}" ${S}/>
          <path d="M8 18L32 36L56 18" fill="none" ${S}/>
          <circle cx="32" cy="36" r="7" fill="${RUBY}" stroke="#5e1020" stroke-width="1"/>
          <path d="M29 35c0-2 3-2 3 0c0-2 3-2 3 0c0 2-3 4-3 4s-3-2-3-4z" fill="${GOLD_L}"/>`; break;
      case "goldStar": /* 金色の星のオーナメント */
        b = `<path d="M32 3V11" ${s}/><path d="M28.5 4Q32 0 35.5 4" fill="none" ${s}/>
          <circle cx="32" cy="12.5" r="2" fill="none" ${s}/>
          <circle cx="32" cy="36" r="24" fill="#ffe9a8" opacity=".22"/>
          <polygon points="${starPts(32, 36, 5, 21, 8.6)}" fill="${G}" ${S}/>
          <polygon points="${starPts(32, 36, 5, 13, 5.4)}" fill="none" stroke="#fff3c8" stroke-width="1" stroke-linejoin="round" opacity=".9"/>
          <circle cx="32" cy="36" r="2.6" fill="${PEARL}" ${s}/>
          ${sparkle(54, 14, 4, G)}${sparkle(10, 52, 3, G)}`; break;
      default: /* omamori */
        b = `<path d="M20 20C20 14 44 14 44 20V54C44 58 20 58 20 54Z" fill="${EMER}" stroke="#123f2e" stroke-width="1.3"/>
          <path d="M20 24H44" stroke="${GOLD_L}" stroke-width="1"/>
          <path d="M32 18C26 10 22 12 25 16C27 18 30 18 32 18C34 18 37 18 39 16C42 12 38 10 32 18Z" fill="${G}" ${s}/>
          <path d="M32 18V8" ${s}/>
          <polygon points="${starPts(32, 40, 5, 8, 3.4)}" fill="${G}" ${s}/>
          <path d="M24 50H40" stroke="${GOLD_L}" stroke-width=".9" stroke-dasharray="1.5 2"/>`;
    }
    return `<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><defs>${goldGrad(g)}</defs>${b}</svg>`;
  };

  /* ============ ③ スタンプの絵柄（中心0,0、だいたい±22） ============ */
  const motif = (kind, ink) => {
    const k = `fill="none" stroke="${ink}" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"`;
    const fi = `fill="${ink}"`;
    switch (kind) {
      case "pudding": return `<path d="M-18 4A18 16 0 0 1 18 4Q18 18 0 18Q-18 18 -18 4Z" ${k}/><path d="M-17 0Q-12 -6 -6 -2Q0 -8 6 -2Q12 -6 17 0" ${k}/><path d="M-4 -12c-6-5-12-2-11 2c5 0 8 1 9 4z" ${fi}/><path d="M4 -12c6-5 12-2 11 2c-5 0-8 1-9 4z" ${fi}/><circle cx="0" cy="-12" r="3" ${fi}/><circle cx="-6" cy="8" r="1.4" ${fi}/><circle cx="6" cy="10" r="1.4" ${fi}/>`;
      case "heart": return `<path d="M0 18C-24 2 -20 -18 -8 -18C-3 -18 0 -14 0 -11C0 -14 3 -18 8 -18C20 -18 24 2 0 18Z" ${k}/><path d="M0 12C-15 1 -13 -12 -7 -12C-3 -12 0 -9 0 -6C0 -9 3 -12 7 -12C13 -12 15 1 0 12Z" fill="none" stroke="${ink}" stroke-width="1.2" stroke-dasharray="2 2"/><path d="M-6 -22Q0 -28 6 -22" ${k}/>`;
      case "buche": return `<path d="M-20 -6H14A6 10 0 0 1 14 14H-20Z" ${k}/><ellipse cx="14" cy="4" rx="6" ry="10" ${k}/><path d="M12 4a2 3 0 1 0 4 0" ${k}/><path d="M-14 -6V14M-6 -6Q-4 4 -6 14M2 -6V14" fill="none" stroke="${ink}" stroke-width="1.1"/><path d="M-10 -10c-5-4-10-2-9 2c4 0 6 1 7 3z" ${fi}/><circle cx="-8" cy="-9" r="2.2" ${fi}/>`;
      case "panettone": return `<path d="M-15 18V0Q-16 -18 0 -19Q16 -18 15 0V18Z" ${k}/><path d="M-15 0Q0 -4 15 0" ${k}/><path d="M-15 6H15" fill="none" stroke="${ink}" stroke-width="1.1" stroke-dasharray="2 2"/><circle cx="-6" cy="-9" r="1.6" ${fi}/><circle cx="5" cy="-12" r="1.6" ${fi}/><circle cx="8" cy="-5" r="1.4" ${fi}/><path d="M-18 18H18" ${k}/>`;
      case "grapes": {
        let c = "";
        [[-8, -6], [0, -6], [8, -6], [-4, 1], [4, 1], [-8, 8 - 1], [8, 7], [0, 8], [-4, 15], [4, 15], [0, 21]].forEach(([x, y]) => { c += `<circle cx="${x}" cy="${y}" r="4" ${k}/>`; });
        return c + `<path d="M0 -10V-18Q6 -22 12 -18" ${k}/><path d="M0 -14c-8-6-16-2-14 4c6 0 10-2 14-4z" ${fi}/>`;
      }
      case "reindeer": return `<path d="M0 20C-8 20 -10 10 -8 2C-7 -4 -4 -6 0 -6C4 -6 7 -4 8 2C10 10 8 20 0 20Z" ${k}/><circle cx="0" cy="16" r="2.6" ${fi}/><path d="M-5 -5C-10 -12 -14 -14 -18 -20M-11 -12L-18 -10M-14 -16L-12 -23M5 -5C10 -12 14 -14 18 -20M11 -12L18 -10M14 -16L12 -23" ${k}/><circle cx="-3.5" cy="4" r="1.4" ${fi}/><circle cx="3.5" cy="4" r="1.4" ${fi}/>`;
      case "lucia": return `<ellipse cx="0" cy="10" rx="20" ry="6" ${k}/><path d="M-14 6V-6M-5 5V-9M5 5V-9M14 6V-6" ${k}/><path d="M-14 -9q2-5 0-8q-2 3 0 8zM-5 -12q2-5 0-8q-2 3 0 8zM5 -12q2-5 0-8q-2 3 0 8zM14 -9q2-5 0-8q-2 3 0 8z" ${fi}/><path d="M-18 14c-4 0-6 3-4 5M18 14c4 0 6 3 4 5" ${k}/>`;
      case "stocking": return `<path d="M-6 -18H8V4L16 10Q20 16 14 20H-2Q-8 20 -8 12Z" ${k}/><path d="M-8 -18H10V-11H-8Z" ${fi}/><path d="M-4 0H4M-4 6H6" fill="none" stroke="${ink}" stroke-width="1.1"/><polygon points="${starPts(0, -26, 5, 4, 1.7)}" ${fi}/>`;
      case "poinsettia": {
        let p = "";
        for (let i = 0; i < 6; i++) p += `<path d="M0 0Q-5 -10 0 -21Q5 -10 0 0Z" transform="rotate(${i * 60})" ${k}/>`;
        for (let i = 0; i < 6; i++) p += `<path d="M0 0Q-3 -6 0 -12Q3 -6 0 0Z" transform="rotate(${i * 60 + 30})" ${fi} opacity=".75"/>`;
        return p + `<circle cx="0" cy="0" r="3" ${fi}/>`;
      }
      case "parol": return `<polygon points="${starPts(0, -4, 5, 18, 8)}" ${k}/><polygon points="${starPts(0, -4, 5, 9, 4)}" ${fi} opacity=".6"/><path d="M-8 10Q-12 18 -16 22M0 12V24M8 10Q12 18 16 22" fill="none" stroke="${ink}" stroke-width="1.4" stroke-dasharray="2.5 2"/>`;
      case "sun": return `<circle cx="0" cy="-6" r="9" ${k}/><path d="M0 -22V-18M0 6V10M-16 -6H-12M12 -6H16M-11 -17L-8 -14M11 -17L8 -14M-11 5L-8 2M11 5L8 2" ${k}/><path d="M-20 14Q-15 10 -10 14T0 14T10 14T20 14M-20 20Q-15 16 -10 20T0 20T10 20T20 20" ${k}/>`;
      case "cake": return `<path d="M-18 4H18V18H-18Z" ${k}/><path d="M-14 -8H14V4H-14Z" ${k}/><path d="M-18 8Q-12 12 -6 8Q0 12 6 8Q12 12 18 8" ${k}/><path d="M0 -8V-16" ${k}/><path d="M0 -17q3-4 0-7q-3 3 0 7z" ${fi}/><circle cx="-8" cy="-11" r="2.4" ${fi}/><circle cx="8" cy="-11" r="2.4" ${fi}/>`;
      case "northstar": return `<path d="M0 -24L3 -3L0 18L-3 -3Z" ${fi}/><path d="M-16 -6L-2 -6M2 -6L16 -6" ${k}/><polygon points="${starPts(0, -6, 4, 9, 2.6, -Math.PI / 4)}" ${fi} opacity=".55"/><circle cx="0" cy="-6" r="2.4" fill="#fffaf0" stroke="${ink}" stroke-width="1.2"/><path d="M-22 20Q-16 15 -10 17Q-4 12 2 16Q9 11 16 15Q20 16 22 20" ${k}/><path d="M-14 17V12L-10 9L-6 12V17M8 16V11L12 8L16 11V16" fill="none" stroke="${ink}" stroke-width="1.4" stroke-linejoin="round"/>`;
      default: /* tree */ return `<path d="M0 -20L-8 -8H-4L-12 4H-6L-16 14H16L6 4H12L4 -8H8Z" ${k}/><polygon points="${starPts(0, -22, 5, 4.4, 1.9)}" ${fi}/><path d="M-22 20Q-16 16 -11 20T0 20T11 20T22 20" ${k}/><circle cx="-4" cy="0" r="1.4" ${fi}/><circle cx="5" cy="8" r="1.4" ${fi}/>`;
    }
  };

  const INKS = ["#a3263a", "#1f6e52", "#26467e", "#9c6f1c"];
  const stampInk = (i) => INKS[i % INKS.length];

  /* スタンプ（120×120）。text:false で文字なし（画像保存用） */
  const stamp = (c, idx, opts) => {
    const o = opts || {};
    const got = !!o.got;
    const oval = o.round ? false : idx % 3 === 1;
    const ink = got ? (o.ink || stampInk(idx)) : "#b7a988";
    const rot = got ? (o.rot != null ? o.rot : ((idx * 37) % 15) - 7) : 0;
    const id = uid("sp");
    const rx = oval ? 56 : 52, ry = oval ? 44 : 52;
    let s = `<svg viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><defs>
      <path id="${id}t" d="M${60 - rx + 17} 60A${rx - 17} ${ry - 17} 0 0 1 ${60 + rx - 17} 60"/>
      <path id="${id}b" d="M${60 - rx + 10} 60A${rx - 10} ${ry - 10} 0 0 0 ${60 + rx - 10} 60"/></defs>
      <g transform="rotate(${rot} 60 60)" opacity="${got ? 0.92 : 0.75}">`;
    if (got) s += `<ellipse cx="60" cy="60" rx="${rx}" ry="${ry}" fill="${ink}" fill-opacity=".06"/>`;
    s += `<ellipse cx="60" cy="60" rx="${rx}" ry="${ry}" fill="none" stroke="${ink}" stroke-width="${got ? 3 : 1.6}" ${got ? "" : 'stroke-dasharray="4 3"'}/>
      <ellipse cx="60" cy="60" rx="${rx - 5}" ry="${ry - 5}" fill="none" stroke="${ink}" stroke-width="1" ${got ? "" : 'opacity=".6"'}/>
      <ellipse cx="60" cy="60" rx="${rx - 22}" ry="${ry - 22}" fill="none" stroke="${ink}" stroke-width="1" stroke-dasharray="1.5 2.5"/>`;
    if (got) {
      s += `<g transform="translate(60 61) scale(${oval ? 0.78 : 0.86})">${motif(c.stamp, ink)}</g>`;
      if (o.text !== false) {
        s += `<text font-family="'Zen Maru Gothic',sans-serif" font-weight="700" font-size="11" fill="${ink}" letter-spacing="1.5" text-anchor="middle"><textPath href="#${id}t" startOffset="50%">${esc(c.name)}</textPath></text>
          <text font-family="'Cormorant Garamond',serif" font-weight="600" font-size="8.5" fill="${ink}" letter-spacing="1.2" text-anchor="middle"><textPath href="#${id}b" startOffset="50%">${esc(o.sub || (c.cityEn || c.nameEn).toUpperCase() + " · NOËL")}</textPath></text>`;
      }
      s += `<polygon points="${starPts(60 - rx + 13, 60, 5, 3.2, 1.3)}" fill="${ink}"/><polygon points="${starPts(60 + rx - 13, 60, 5, 3.2, 1.3)}" fill="${ink}"/>`;
    } else {
      s += `<g transform="translate(60 61) scale(${oval ? 0.78 : 0.86})" opacity=".35">${motif(c.stamp, ink)}</g>`;
    }
    s += `</g></svg>`;
    return s;
  };

  /* ============ ④ 絵はがき風の風景（400×300） ============ */
  const W = 400, H = 300;

  const skyDefs = (id, kind) => {
    const sets = {
      night: ["#081332", "#142a5a", "#2c4a7e", "#c9a46a"],
      warm: ["#0d1236", "#2b2160", "#6a3a6a", "#e6a06a"],
      dusk: ["#24407e", "#5c6fa8", "#e7a77a", "#f8d9a6"]
    }[kind];
    return `<linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${sets[0]}"/><stop offset=".45" stop-color="${sets[1]}"/><stop offset=".8" stop-color="${sets[2]}"/><stop offset="1" stop-color="${sets[3]}" stop-opacity=".9"/></linearGradient>`;
  };
  const starsLayer = (rng, n, ymax) => {
    let s = "";
    for (let i = 0; i < n; i++) {
      const x = f1(rng() * W), y = f1(rng() * ymax), r = f1(0.4 + rng() * 1.1);
      s += `<circle cx="${x}" cy="${y}" r="${r}" fill="#fff" opacity="${f1(0.4 + rng() * 0.6)}"/>`;
    }
    s += sparkle(f1(40 + rng() * 320), f1(14 + rng() * 40), 4, "#fff7d6");
    return s;
  };
  const moon = (x, y, r) => `<circle cx="${x}" cy="${y}" r="${r * 3}" fill="#fff3c8" opacity=".12"/><circle cx="${x}" cy="${y}" r="${r}" fill="#fff6dc"/><circle cx="${x - r * .3}" cy="${y - r * .2}" r="${r * .22}" fill="#efe2bd" opacity=".6"/>`;
  const glowDot = (x, y, r, col, op) => `<circle cx="${f1(x)}" cy="${f1(y)}" r="${f1(r * 3.2)}" fill="${col}" opacity="${f1((op || 1) * 0.18)}"/><circle cx="${f1(x)}" cy="${f1(y)}" r="${f1(r)}" fill="${col}" opacity="${op || 1}"/>`;

  const windowsIn = (rng, x, y, w, h, opts) => {
    const o = opts || {};
    let s = "";
    const cols = Math.max(1, Math.floor(w / (o.gap || 13)));
    const rows = Math.max(1, Math.floor(h / (o.vgap || 16)));
    const cw = w / cols, rh = h / rows;
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
      if (rng() < (o.dark || 0.25)) continue;
      const wx = x + c * cw + cw * 0.28, wy = y + r * rh + rh * 0.25;
      const ww = cw * 0.44, wh = rh * (o.tall ? 0.6 : 0.45);
      const col = rng() < 0.5 ? "#ffd98a" : "#ffc76a";
      if (o.arch) s += `<path d="M${f1(wx)} ${f1(wy + wh)}V${f1(wy + ww / 2)}A${f1(ww / 2)} ${f1(ww / 2)} 0 0 1 ${f1(wx + ww)} ${f1(wy + ww / 2)}V${f1(wy + wh)}Z" fill="${col}" opacity="${f1(0.7 + rng() * 0.3)}"/>`;
      else s += `<rect x="${f1(wx)}" y="${f1(wy)}" width="${f1(ww)}" height="${f1(wh)}" rx=".8" fill="${col}" opacity="${f1(0.65 + rng() * 0.35)}"/>`;
    }
    return s;
  };

  /* 家なみ。roof: gable（とんがり屋根）/ flat / step */
  const houses = (rng, o) => {
    let s = "", x = o.x0;
    while (x < o.x1) {
      const w = o.wMin + rng() * (o.wMax - o.wMin);
      const h = o.hMin + rng() * (o.hMax - o.hMin);
      const y = o.base - h;
      const col = o.colors[Math.floor(rng() * o.colors.length)];
      s += `<rect x="${f1(x)}" y="${f1(y)}" width="${f1(w + 0.6)}" height="${f1(h)}" fill="${col}"/>`;
      if (o.roof === "gable") {
        const rh = w * (0.45 + rng() * 0.25);
        s += `<path d="M${f1(x - 2)} ${f1(y)}L${f1(x + w / 2)} ${f1(y - rh)}L${f1(x + w + 2)} ${f1(y)}Z" fill="${o.roofCol || "#1a223e"}"/>`;
        if (o.snowRoof) s += `<path d="M${f1(x - 2)} ${f1(y)}L${f1(x + w / 2)} ${f1(y - rh)}L${f1(x + w + 2)} ${f1(y)}L${f1(x + w - 2)} ${f1(y + 1.5)}L${f1(x + w / 2)} ${f1(y - rh + 4)}L${f1(x + 2)} ${f1(y + 1.5)}Z" fill="#eef4ff" opacity=".92"/>`;
        if (o.timber) s += `<path d="M${f1(x + 2)} ${f1(y + h * .35)}H${f1(x + w - 2)}M${f1(x + 2)} ${f1(y + h * .7)}H${f1(x + w - 2)}M${f1(x + w * .5)} ${f1(y)}V${f1(o.base)}M${f1(x + 2)} ${f1(y + h * .35)}L${f1(x + w * .5)} ${f1(y + h * .7)}" stroke="#3b2618" stroke-width="1.6" opacity=".75"/>`;
        s += `<rect x="${f1(x + w / 2 - 2.5)}" y="${f1(y - rh * 0.55)}" width="5" height="5" rx="2.5" fill="#ffd98a" opacity=".85"/>`;
      } else if (o.roof === "step") {
        s += `<path d="M${f1(x)} ${f1(y)}h${f1(w * .2)}v-5h${f1(w * .2)}v-5h${f1(w * .2)}v5h${f1(w * .2)}v5h${f1(w * .2)}" fill="${col}"/>`;
        if (o.snowRoof) s += `<path d="M${f1(x)} ${f1(y)}h${f1(w * .2)}v-5h${f1(w * .2)}v-5h${f1(w * .2)}v5h${f1(w * .2)}v5h${f1(w * .2)}" fill="none" stroke="#eef4ff" stroke-width="1.6" opacity=".9"/>`;
      } else if (o.chimney && rng() < .7) {
        s += `<rect x="${f1(x + w * .7)}" y="${f1(y - 9)}" width="6" height="9" fill="${col}"/>`;
      }
      s += windowsIn(rng, x + 2, y + 4, w - 4, h - 10, o.win || {});
      x += w + (o.gapMin || 0);
    }
    return s;
  };

  const xmasTree = (x, base, h, opts) => {
    const o = opts || {};
    const w = h * 0.62;
    let s = `<rect x="${f1(x - h * .035)}" y="${f1(base - h * .1)}" width="${f1(h * .07)}" height="${f1(h * .1)}" fill="#3b2618"/>`;
    const tiers = 4;
    for (let i = 0; i < tiers; i++) {
      const ty = base - h * .08 - (h * .9) * (i / tiers);
      const tw = w * (1 - i / (tiers + 0.6));
      s += `<path d="M${f1(x - tw / 2)} ${f1(ty)}Q${f1(x)} ${f1(ty - h * .06)} ${f1(x + tw / 2)} ${f1(ty)}L${f1(x)} ${f1(ty - h * .34)}Z" fill="${o.col || "#174a37"}"/>`;
      if (o.snow) s += `<path d="M${f1(x - tw / 2)} ${f1(ty)}Q${f1(x)} ${f1(ty - h * .06)} ${f1(x + tw / 2)} ${f1(ty)}L${f1(x + tw * .36)} ${f1(ty - h * .03)}Q${f1(x)} ${f1(ty - h * .08)} ${f1(x - tw * .36)} ${f1(ty - h * .03)}Z" fill="#eef4ff" opacity=".85"/>`;
    }
    const n = Math.round(h / 4);
    for (let i = 0; i < n; i++) {
      const t = (i + 0.5) / n;
      const yy = base - h * .12 - t * h * .78;
      const half = (w / 2) * (1 - t) * 0.85;
      const xx = x + Math.sin(i * 2.4) * half;
      s += glowDot(xx, yy, Math.max(0.9, h / 80), i % 4 === 0 ? "#ff8a7a" : "#ffe08a");
    }
    s += `<polygon points="${starPts(x, base - h * 1.0, 5, h * .07, h * .03)}" fill="#ffe7a0"/>` + `<circle cx="${f1(x)}" cy="${f1(base - h)}" r="${f1(h * .18)}" fill="#ffe7a0" opacity=".14"/>`;
    return s;
  };

  const garland = (x0, y0, x1, y1, sag, n, cols) => {
    let s = `<path d="M${x0} ${y0}Q${(x0 + x1) / 2} ${(y0 + y1) / 2 + sag} ${x1} ${y1}" fill="none" stroke="#1b1b2b" stroke-width=".8" opacity=".7"/>`;
    for (let i = 1; i < n; i++) {
      const t = i / n;
      const x = (1 - t) * (1 - t) * x0 + 2 * (1 - t) * t * ((x0 + x1) / 2) + t * t * x1;
      const y = (1 - t) * (1 - t) * y0 + 2 * (1 - t) * t * ((y0 + y1) / 2 + sag) + t * t * y1;
      s += glowDot(x, y + 1.5, 1.5, cols[i % cols.length]);
    }
    return s;
  };

  const snowGround = (id, y) => `<defs><linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f4f8ff"/><stop offset="1" stop-color="#a9bad8"/></linearGradient></defs>
    <path d="M0 ${y}Q100 ${y - 8} 200 ${y - 2}T400 ${y - 4}V300H0Z" fill="url(#${id})"/>`;
  const fallingSnow = (rng, n) => {
    let s = "";
    for (let i = 0; i < n; i++) s += `<circle cx="${f1(rng() * W)}" cy="${f1(rng() * H)}" r="${f1(0.6 + rng() * 1.5)}" fill="#fff" opacity="${f1(0.5 + rng() * 0.5)}"/>`;
    return s;
  };
  const water = (id, y, lights) => {
    const s = `<defs><linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1b2f5c"/><stop offset="1" stop-color="#0a1430"/></linearGradient></defs>
      <rect x="0" y="${y}" width="400" height="${300 - y}" fill="url(#${id})"/>`;
    return s + (lights || []).map(([x, col]) => {
      let r = "";
      for (let k = 0; k < 6; k++) r += `<rect x="${f1(x - 6 + k % 2 * 3)}" y="${f1(y + 4 + k * 6)}" width="${f1(10 - k)}" height="1.4" rx=".7" fill="${col}" opacity="${f1(0.55 - k * 0.07)}"/>`;
      return r;
    }).join("");
  };
  const stalls = (rng, x0, x1, base, cols) => {
    let s = "", x = x0;
    while (x < x1 - 20) {
      const w = 34 + rng() * 12, h = 22;
      const c = cols[Math.floor(rng() * cols.length)];
      s += `<rect x="${f1(x)}" y="${f1(base - h)}" width="${f1(w)}" height="${h}" fill="#3a2416"/>
        <rect x="${f1(x + 3)}" y="${f1(base - h + 6)}" width="${f1(w - 6)}" height="${h - 10}" fill="#ffcf73" opacity=".85"/>
        <path d="M${f1(x - 4)} ${f1(base - h)}L${f1(x + w / 2)} ${f1(base - h - 14)}L${f1(x + w + 4)} ${f1(base - h)}Z" fill="${c}"/>
        <path d="M${f1(x - 4)} ${f1(base - h)}L${f1(x + w / 2)} ${f1(base - h - 14)}L${f1(x + w + 4)} ${f1(base - h)}" fill="none" stroke="#eef4ff" stroke-width="2" opacity=".85"/>`;
      s += garland(x, base - h + 2, x + w, base - h + 2, 4, 6, ["#ffe08a"]);
      x += w + 8;
    }
    return s;
  };
  const palm = (x, base, h, flip) => {
    const d = flip ? -1 : 1;
    let s = `<path d="M${x} ${base}Q${x + d * h * .12} ${base - h * .5} ${x + d * h * .05} ${base - h}" fill="none" stroke="#1b1a2a" stroke-width="${f1(h * .05)}" stroke-linecap="round"/>`;
    const tx = x + d * h * .05, ty = base - h;
    [[-1, .1], [-.6, -.4], [0, -.5], [.6, -.35], [1, .15], [.4, .35], [-.4, .3]].forEach(([a, b]) => {
      s += `<path d="M${f1(tx)} ${f1(ty)}Q${f1(tx + a * h * .3)} ${f1(ty + b * h * .3 - h * .12)} ${f1(tx + a * h * .45)} ${f1(ty + b * h * .45 + h * .08)}" fill="none" stroke="#1b1a2a" stroke-width="${f1(h * .035)}" stroke-linecap="round"/>`;
    });
    return s;
  };
  const parolShape = (x, y, r, col) => `<circle cx="${x}" cy="${y}" r="${f1(r * 2.2)}" fill="${col}" opacity=".16"/><polygon points="${starPts(x, y, 5, r, r * .45)}" fill="${col}"/><polygon points="${starPts(x, y, 5, r * .5, r * .22)}" fill="#fff6d0" opacity=".8"/><path d="M${f1(x - r * .4)} ${f1(y + r * .6)}l-3 ${f1(r)}M${x} ${f1(y + r * .5)}v${f1(r * 1.2)}M${f1(x + r * .4)} ${f1(y + r * .6)}l3 ${f1(r)}" stroke="${col}" stroke-width="1" opacity=".8"/>`;

  const postcard = (c) => {
    if (c.scene === "northstar") return northStarScene();
    const rng = rngFrom(c.id + "pc");
    const sky = uid("sky"), gnd = uid("gd"), wat = uid("wa"), vg = uid("vg");
    const scene = c.scene;
    const skyKind = scene === "beach" ? "dusk" : (scene === "tropical" || scene === "fiesta" || scene === "plaza" || scene === "piazza") ? "warm" : "night";
    let defs = skyDefs(sky, skyKind) + `<radialGradient id="${vg}" cx=".5" cy=".5" r=".75"><stop offset=".6" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".45"/></radialGradient>`;
    let b = `<rect width="400" height="300" fill="url(#${sky})"/>`;
    if (skyKind !== "dusk") b += starsLayer(rng, 60, 150);

    switch (scene) {
      case "london":
        b += moon(330, 50, 14);
        b += houses(rng, { x0: -10, x1: 410, base: 232, hMin: 80, hMax: 120, wMin: 40, wMax: 58, roof: "flat", chimney: true, colors: ["#2a2440", "#2e2a48", "#262036"], win: { gap: 12, vgap: 20, tall: true, dark: .3 } });
        b += garland(0, 150, 200, 150, 22, 16, ["#ffe08a", "#fff3c4"]) + garland(200, 150, 400, 150, 22, 16, ["#ffe08a", "#fff3c4"]);
        b += garland(0, 182, 400, 182, 26, 26, ["#ffe08a", "#ff9a8a"]);
        b += `<rect x="0" y="232" width="400" height="68" fill="#1c1a2c"/><path d="M0 250H400M0 270H400" stroke="#2e2a44" stroke-width="1"/>`;
        [60, 200, 340].forEach((x) => { b += `<rect x="${x - 1.5}" y="190" width="3" height="44" fill="#151320"/>` + glowDot(x, 188, 5, "#ffe3a0"); });
        b += xmasTree(120, 236, 70, {}) + fallingSnow(rng, 18);
        break;
      case "market":
        b += moon(70, 50, 12);
        b += houses(rng, { x0: -10, x1: 410, base: 214, hMin: 50, hMax: 80, wMin: 34, wMax: 50, roof: "gable", timber: true, snowRoof: true, colors: ["#5a3b2c", "#6b4a34", "#4c3a46", "#5c4030"], win: { gap: 12, vgap: 16, dark: .35 } });
        b += snowGround(gnd, 230);
        b += stalls(rng, 10, 400, 262, ["#9e1f30", "#1e6a4e", "#7a2030"]);
        b += xmasTree(300, 214, 92, { snow: true }) + fallingSnow(rng, 45);
        break;
      case "canal":
        b += moon(320, 46, 12);
        b += houses(rng, { x0: -10, x1: 410, base: 200, hMin: 62, hMax: 96, wMin: 36, wMax: 50, roof: "gable", timber: true, snowRoof: true, colors: ["#6d4b36", "#7a5a3c", "#5d4a5e", "#80603e"], win: { gap: 12, vgap: 17, dark: .3 } });
        b += garland(0, 128, 400, 128, 18, 30, ["#ffe08a", "#ff9a8a", "#fff3c4"]);
        b += `<rect x="0" y="200" width="400" height="10" fill="#3b3a50"/>`;
        b += water(wat, 210, [[40, "#ffd98a"], [110, "#ffd98a"], [190, "#ffc76a"], [260, "#ffd98a"], [340, "#ffc76a"]]);
        b += `<path d="M150 210Q200 176 250 210" fill="none" stroke="#3b3a50" stroke-width="8"/>` + garland(150, 204, 250, 204, -26, 12, ["#ffe08a"]);
        b += fallingSnow(rng, 35);
        break;
      case "piazza":
        b += moon(330, 44, 12);
        b += `<path d="M150 150Q150 96 200 92Q250 96 250 150Z" fill="#2b2140"/><rect x="194" y="78" width="12" height="16" fill="#2b2140"/><circle cx="200" cy="74" r="4" fill="#2b2140"/>`;
        b += houses(rng, { x0: -10, x1: 410, base: 222, hMin: 70, hMax: 92, wMin: 46, wMax: 64, roof: "flat", colors: ["#6a3a32", "#7a4a36", "#5e3a3a", "#8a5a3a"], win: { gap: 14, vgap: 20, tall: true, arch: true, dark: .3 } });
        b += `<rect x="0" y="222" width="400" height="78" fill="#3a2a2e"/><ellipse cx="200" cy="262" rx="70" ry="14" fill="#4a3a3e"/><ellipse cx="200" cy="258" rx="58" ry="9" fill="#2b3e62"/><rect x="196" y="226" width="8" height="32" fill="#5a4a4e"/>`;
        b += stalls(rng, 0, 120, 266, ["#9e1f30", "#b4862c"]) + stalls(rng, 290, 410, 266, ["#1e6a4e", "#9e1f30"]);
        b += garland(0, 160, 400, 160, 20, 30, ["#ffe08a", "#fff3c4"]);
        break;
      case "plaza":
        b += houses(rng, { x0: -10, x1: 410, base: 220, hMin: 96, hMax: 110, wMin: 70, wMax: 90, roof: "flat", colors: ["#6a3a2e", "#743f30"], win: { gap: 14, vgap: 22, tall: true, dark: .2 } });
        b += `<rect x="0" y="196" width="400" height="24" fill="#4a2a24"/>`;
        for (let i = 0; i < 12; i++) b += `<path d="M${i * 34 + 4} 220V206A13 13 0 0 1 ${i * 34 + 30} 206V220Z" fill="#ffcf73" opacity=".75"/>`;
        b += `<rect x="0" y="220" width="400" height="80" fill="#3a2626"/>`;
        for (let k = 0; k < 4; k++) b += garland(0, 60 + k * 30, 400, 60 + k * 30, 30, 34, ["#ffe08a", "#fff3c4", "#ffd0a0"]);
        b += xmasTree(200, 280, 96, { col: "#1d5a42" });
        break;
      case "aurora": {
        const ag = uid("au");
        defs += `<linearGradient id="${ag}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#7cf0c0" stop-opacity="0"/><stop offset=".5" stop-color="#6ce0b0" stop-opacity=".55"/><stop offset="1" stop-color="#3aa0c0" stop-opacity="0"/></linearGradient>`;
        b += `<path d="M-20 120C60 40 120 110 200 60S330 30 420 80L420 130C330 80 280 120 200 110S60 90 -20 160Z" fill="url(#${ag})"/>
          <path d="M40 90C120 30 200 70 260 40S360 20 420 50L420 70C360 50 300 80 250 70S120 70 40 110Z" fill="url(#${ag})" opacity=".7"/>`;
        b += snowGround(gnd, 214);
        for (let i = 0; i < 22; i++) {
          const x = i * 19 + rng() * 8, h = 40 + rng() * 40;
          b += `<path d="M${f1(x)} ${f1(220 - h)}L${f1(x - h * .22)} 222H${f1(x + h * .22)}Z" fill="#12283a"/><path d="M${f1(x)} ${f1(220 - h)}L${f1(x - h * .1)} ${f1(220 - h * .6)}H${f1(x + h * .1)}Z" fill="#eef4ff" opacity=".7"/>`;
        }
        [[110, 256], [250, 262]].forEach(([x, y]) => {
          b += `<rect x="${x - 22}" y="${y - 22}" width="44" height="22" fill="#4a2e22"/><path d="M${x - 28} ${y - 22}L${x} ${y - 42}L${x + 28} ${y - 22}Z" fill="#eef4ff"/><rect x="${x - 14}" y="${y - 16}" width="9" height="8" fill="#ffd98a"/><rect x="${x + 5}" y="${y - 16}" width="9" height="8" fill="#ffd98a"/>` + `<circle cx="${x}" cy="${y - 10}" r="30" fill="#ffd98a" opacity=".08"/>`;
        });
        b += fallingSnow(rng, 30);
        break;
      }
      case "harbor":
        b += moon(80, 48, 12);
        b += houses(rng, { x0: -10, x1: 410, base: 206, hMin: 70, hMax: 100, wMin: 26, wMax: 38, roof: "step", snowRoof: true, colors: ["#8a4a2a", "#b0823a", "#6a3a3a", "#9a6a3a", "#5a5a6a"], win: { gap: 10, vgap: 15, dark: .3 } });
        b += `<rect x="0" y="206" width="400" height="8" fill="#e6eefb" opacity=".9"/>`;
        b += water(wat, 214, [[30, "#ffd98a"], [90, "#ffc76a"], [160, "#ffd98a"], [230, "#ffd98a"], [300, "#ffc76a"], [370, "#ffd98a"]]);
        b += `<path d="M260 246H340L330 258H272Z" fill="#141a2e"/><rect x="298" y="208" width="2" height="38" fill="#141a2e"/>` + garland(299, 208, 340, 244, 2, 6, ["#ffe08a"]) + garland(299, 208, 262, 244, 2, 6, ["#ffe08a"]);
        b += fallingSnow(rng, 35);
        break;
      case "skyline":
        b += houses(rng, { x0: -10, x1: 410, base: 214, hMin: 90, hMax: 170, wMin: 30, wMax: 52, roof: "flat", colors: ["#1e2442", "#232a4c", "#1a2038"], win: { gap: 8, vgap: 10, dark: .45 } });
        b += `<rect x="0" y="214" width="400" height="86" fill="#1a1e34"/>`;
        b += `<ellipse cx="200" cy="268" rx="120" ry="18" fill="#cfe0f5" opacity=".85"/><ellipse cx="200" cy="268" rx="120" ry="18" fill="none" stroke="#ffe08a" stroke-width="1.2" opacity=".7"/>`;
        b += xmasTree(200, 250, 150, { col: "#164633" });
        b += garland(0, 226, 400, 226, 6, 40, ["#ffe08a", "#fff3c4"]) + fallingSnow(rng, 30);
        break;
      case "fiesta": {
        b += houses(rng, { x0: -10, x1: 410, base: 232, hMin: 56, hMax: 80, wMin: 44, wMax: 64, roof: "flat", colors: ["#b0464a", "#c08a3a", "#3a6a7a", "#8a4a7a", "#4a7a4a"], win: { gap: 16, vgap: 20, tall: true, arch: true, dark: .2 } });
        b += `<rect x="0" y="0" width="400" height="300" fill="#0b0f30" opacity=".25"/>`;
        b += `<rect x="0" y="232" width="400" height="68" fill="#3a2a2e"/>`;
        const pc = ["#e0455a", "#f0b13a", "#3ab0a0", "#c060b0", "#7ac050"];
        [[96, 22], [128, 18]].forEach(([y, sag]) => {
          b += `<path d="M0 ${y}Q200 ${y + sag * 2} 400 ${y}" fill="none" stroke="#e8dcc0" stroke-width=".8" opacity=".6"/>`;
          for (let i = 0; i < 20; i++) {
            const t = (i + .5) / 20, x = t * 400, yy = (1 - t) * (1 - t) * y + 2 * (1 - t) * t * (y + sag * 2) + t * t * y;
            b += `<path d="M${f1(x - 7)} ${f1(yy)}H${f1(x + 7)}V${f1(yy + 12)}L${f1(x)} ${f1(yy + 16)}L${f1(x - 7)} ${f1(yy + 12)}Z" fill="${pc[i % pc.length]}" opacity=".85"/>`;
          }
        });
        b += parolShape(300, 172, 14, "#f0b13a");
        for (let i = 0; i < 5; i++) {
          const x = 30 + i * 85, y = 262;
          for (let k = 0; k < 6; k++) b += `<path d="M${x} ${y}Q${x - 3} ${y - 7} ${x} ${y - 13}Q${x + 3} ${y - 7} ${x} ${y}Z" transform="rotate(${k * 60} ${x} ${y})" fill="#c8243a"/>`;
          b += `<circle cx="${x}" cy="${y}" r="2.2" fill="#f0d040"/>`;
        }
        b += garland(0, 236, 400, 236, 8, 30, ["#ffe08a", "#ff9a8a"]);
        break;
      }
      case "tropical":
        b += moon(330, 42, 11);
        b += houses(rng, { x0: -10, x1: 410, base: 236, hMin: 40, hMax: 62, wMin: 44, wMax: 60, roof: "gable", roofCol: "#2a2236", colors: ["#3a3a52", "#4a3a4a", "#3a4a4e"], win: { gap: 14, vgap: 16, dark: .2 } });
        b += palm(40, 240, 120, false) + palm(370, 240, 110, true) + palm(250, 236, 80, false);
        b += `<rect x="0" y="236" width="400" height="64" fill="#231e30"/>`;
        [[90, 120, 15, "#f0b13a"], [160, 98, 12, "#e0455a"], [220, 128, 16, "#f0d06a"], [300, 104, 13, "#7ac0e0"], [130, 170, 11, "#c060b0"], [270, 168, 12, "#f0b13a"]].forEach(([x, y, r, col]) => { b += parolShape(x, y, r, col); });
        b += garland(0, 200, 400, 200, 10, 34, ["#ffe08a", "#ff9a8a", "#9ae0ff"]);
        break;
      case "beach": {
        const sg = uid("sea");
        defs += `<linearGradient id="${sg}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3f7fb0"/><stop offset="1" stop-color="#1e4a7a"/></linearGradient>`;
        b += `<circle cx="300" cy="168" r="60" fill="#fff0c0" opacity=".25"/><circle cx="300" cy="168" r="24" fill="#fff4d0"/>`;
        b += `<path d="M0 150Q40 140 80 150T160 148L160 180H0Z" fill="#5a6a8a" opacity=".55"/>`;
        b += `<rect x="0" y="178" width="400" height="60" fill="url(#${sg})"/>`;
        for (let i = 0; i < 6; i++) b += `<rect x="${270 + (i % 2) * 6}" y="${184 + i * 8}" width="${50 - i * 6}" height="1.6" rx=".8" fill="#fff4d0" opacity="${f1(.7 - i * .1)}"/>`;
        [[90, 190, 1], [150, 200, .8]].forEach(([x, y, s2]) => { b += `<path d="M${x} ${y}h${30 * s2}l-4 ${6 * s2}h${-22 * s2}z" fill="#f4f0e8"/><path d="M${x + 14 * s2} ${y}V${y - 30 * s2}L${x + 30 * s2} ${y - 2}Z" fill="#fffaf0"/>`; });
        b += `<path d="M0 238Q100 226 200 236T400 232V300H0Z" fill="#e8cf9a"/><path d="M0 238Q100 226 200 236T400 232" fill="none" stroke="#fff" stroke-width="3" opacity=".8"/>`;
        b += palm(40, 262, 110, false) + xmasTree(330, 284, 54, { col: "#1d5a42" });
        b += `<path d="M150 276l40-22l40 22z" fill="#c8243a"/><rect x="189" y="254" width="2" height="34" fill="#6a4a2a"/>`;
        break;
      }
      case "lights":
        b += moon(330, 44, 11);
        b += houses(rng, { x0: -10, x1: 410, base: 206, hMin: 100, hMax: 160, wMin: 34, wMax: 58, roof: "flat", colors: ["#1f2546", "#242a4e", "#1c2140"], win: { gap: 9, vgap: 11, dark: .4 } });
        b += `<rect x="0" y="206" width="400" height="94" fill="#1c1e34"/>`;
        for (let k = 0; k < 5; k++) {
          const sc = 1 - k * 0.15, cy = 300 - k * 14, rx = 190 * sc, ry = 150 * sc;
          const col = k % 2 ? "#ffe08a" : "#bfe0ff";
          for (let i = 0; i <= 18; i++) {
            const a = Math.PI + (Math.PI * i) / 18;
            b += glowDot(200 + Math.cos(a) * rx, cy + Math.sin(a) * ry * .9, 1.6 * sc + .4, col, .95);
          }
        }
        b += fallingSnow(rng, 40);
        break;
      default: /* port（港町） */
        b += moon(64, 46, 11);
        b += `<path d="M0 150L60 110L120 140L200 96L280 130L340 104L400 140V190H0Z" fill="#1c2a4a"/><path d="M200 96L216 108L206 106L198 112L190 104Z" fill="#eef4ff" opacity=".8"/>`;
        for (let i = 0; i < 60; i++) b += `<circle cx="${f1(rng() * 400)}" cy="${f1(150 + rng() * 40)}" r="${f1(.6 + rng() * .8)}" fill="#ffd98a" opacity="${f1(.5 + rng() * .5)}"/>`;
        for (let i = 0; i < 4; i++) {
          const x = -6 + i * 64;
          b += `<rect x="${x}" y="182" width="60" height="38" fill="#7a3a2a"/><path d="M${x} 182h60l-4-10h-52z" fill="#5a2a22"/><path d="M${x} 182h60l-4-10h-52z" fill="none" stroke="#eef4ff" stroke-width="2"/>`;
          b += `<path d="M${x + 18} 220V204a12 12 0 0 1 24 0V220Z" fill="#ffcf73" opacity=".85"/>`;
          b += garland(x, 184, x + 60, 184, 5, 7, ["#ffe08a"]);
        }
        b += water(wat, 220, [[40, "#ffd98a"], [110, "#ffc76a"], [180, "#ffd98a"], [330, "#ffe08a"]]);
        b += `<rect x="300" y="250" width="60" height="6" fill="#2a2a3a"/>` + xmasTree(330, 250, 92, { snow: true });
        b += fallingSnow(rng, 40);
    }
    b += `<rect width="400" height="300" fill="url(#${vg})"/>`;
    return `<svg viewBox="0 0 400 300" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><defs>${defs}</defs>${b}</svg>`;
  };

  /* ============ ⑥ ひみつの14番目（北極星の村）のスタンプ ============ */
  /* revealed=false：まだ開いていない「？」の金のスタンプ／true：金色の北極星のスタンプ */
  const secretStamp = (c, revealed, opts) => {
    if (revealed) return stamp(c, 13, Object.assign({ got: true, ink: "#a87a1e", round: true, rot: -3, sub: "NORTH STAR · NOËL" }, opts || {}));
    const g = uid("ss");
    return `<svg viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><defs>${goldGrad(g, true)}
      <radialGradient id="${g}r"><stop offset="0" stop-color="#fff6d6" stop-opacity=".9"/><stop offset="1" stop-color="#f3d98f" stop-opacity="0"/></radialGradient></defs>
      <circle cx="60" cy="60" r="56" fill="url(#${g}r)" opacity=".55"/>
      <circle cx="60" cy="60" r="50" fill="none" stroke="url(#${g})" stroke-width="2.4" stroke-dasharray="5 3.5"/>
      <circle cx="60" cy="60" r="44" fill="none" stroke="${GOLD}" stroke-width=".9" opacity=".7"/>
      <text x="60" y="76" text-anchor="middle" font-family="'Shippori Mincho B1',serif" font-weight="800" font-size="46" fill="url(#${g})" stroke="${GOLD_D}" stroke-width=".8">？</text>
      <polygon points="${starPts(60, 16, 4, 5, 1.6)}" fill="${GOLD}"/><polygon points="${starPts(60, 104, 4, 5, 1.6)}" fill="${GOLD}"/>
      <polygon points="${starPts(16, 60, 4, 4, 1.4)}" fill="${GOLD}"/><polygon points="${starPts(104, 60, 4, 4, 1.4)}" fill="${GOLD}"/></svg>`;
  };

  /* 北極星の村の風景（オーロラの下の、雪の小さな村。物語の中の村です） */
  const northStarScene = () => {
    const rng = rngFrom("northstar-village");
    const sky = uid("ns"), au = uid("au"), au2 = uid("av"), snow = uid("sn"), glow = uid("gw"), vg = uid("vg");
    let defs = `<linearGradient id="${sky}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#050b26"/><stop offset=".55" stop-color="#0f2350"/><stop offset="1" stop-color="#28457a"/></linearGradient>
      <linearGradient id="${au}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#8f7cf0" stop-opacity="0"/><stop offset=".35" stop-color="#7fe6c8" stop-opacity=".55"/><stop offset=".8" stop-color="#3fc0a0" stop-opacity=".25"/><stop offset="1" stop-color="#3fc0a0" stop-opacity="0"/></linearGradient>
      <linearGradient id="${au2}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#b48cf0" stop-opacity="0"/><stop offset=".5" stop-color="#a890f0" stop-opacity=".3"/><stop offset="1" stop-color="#5ad0c0" stop-opacity="0"/></linearGradient>
      <linearGradient id="${snow}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f4f8ff"/><stop offset="1" stop-color="#b4c4e2"/></linearGradient>
      <radialGradient id="${glow}"><stop offset="0" stop-color="#fff4cc" stop-opacity=".95"/><stop offset=".3" stop-color="#ffe08a" stop-opacity=".35"/><stop offset="1" stop-color="#ffe08a" stop-opacity="0"/></radialGradient>
      <radialGradient id="${vg}" cx=".5" cy=".5" r=".75"><stop offset=".6" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".4"/></radialGradient>`;
    let b = `<rect width="400" height="300" fill="url(#${sky})"/>` + starsLayer(rng, 80, 170);
    /* オーロラのカーテン（縦のすじを重ねて） */
    b += `<path d="M-20 150C40 70 110 130 180 80S300 40 420 90L420 150C320 110 260 150 180 140S50 130 -20 190Z" fill="url(#${au})"/>
      <path d="M60 120C120 50 200 90 260 55S360 40 420 60L420 90C350 70 300 100 250 95S130 100 60 140Z" fill="url(#${au2})"/>`;
    for (let i = 0; i < 26; i++) {
      const x = 10 + i * 15 + rng() * 6, top = 60 + Math.sin(i * 0.55) * 22 + rng() * 10, h = 40 + rng() * 40;
      b += `<rect x="${f1(x)}" y="${f1(top)}" width="${f1(1.2 + rng() * 2)}" height="${f1(h)}" fill="#9ff5da" opacity="${f1(0.06 + rng() * 0.1)}"/>`;
    }
    /* 北極星 */
    b += `<circle cx="300" cy="46" r="34" fill="url(#${glow})"/>
      <path d="M300 22L302.4 43.6L300 70L297.6 43.6Z M276 46L297.6 43.6L324 46L297.6 48.4Z" fill="#fff6dc"/>
      <polygon points="${starPts(300, 46, 4, 7, 2, -Math.PI / 4)}" fill="#fff6dc" opacity=".8"/><circle cx="300" cy="46" r="2.6" fill="#fff"/>`;
    /* 遠くの雪山と丘 */
    b += `<path d="M0 200L50 168L90 186L150 150L210 182L260 160L320 178L400 150V230H0Z" fill="#2a3f6e"/>
      <path d="M150 150L162 160L154 158L146 164L140 158Z M260 160L270 168L262 167L254 171Z" fill="#e8f0ff" opacity=".7"/>
      <path d="M0 226Q100 200 200 214T400 208V300H0Z" fill="url(#${snow})"/>`;
    /* もみの木 */
    [[28, 236, 34], [62, 228, 24], [352, 224, 30], [380, 232, 22], [180, 214, 18]].forEach(([x, base, h]) => {
      b += `<path d="M${x} ${base - h}L${f1(x - h * .32)} ${base}H${f1(x + h * .32)}Z" fill="#163a3a"/><path d="M${x} ${base - h}L${f1(x - h * .14)} ${f1(base - h * .55)}H${f1(x + h * .14)}Z" fill="#eef4ff" opacity=".75"/>`;
    });
    /* 小さな村（窓に温かい灯り）と工房 */
    const house = (x, base, w, h, col, win) => {
      const rh = w * .5;
      let s2 = `<rect x="${x}" y="${base - h}" width="${w}" height="${h}" fill="${col}"/>`;
      s2 += `<path d="M${x - 4} ${base - h}L${x + w / 2} ${base - h - rh}L${x + w + 4} ${base - h}Z" fill="#f4f8ff"/>`;
      s2 += `<path d="M${x - 4} ${base - h}L${x + w + 4} ${base - h}" stroke="#c9d6ee" stroke-width="1.5"/>`;
      win.forEach(([wx, wy, ww, wh]) => { s2 += `<rect x="${x + wx}" y="${base - h + wy}" width="${ww}" height="${wh}" fill="#ffd27a"/><rect x="${x + wx}" y="${base - h + wy}" width="${ww}" height="${wh}" fill="none" stroke="#7a4a22" stroke-width=".6"/>`; });
      s2 += `<circle cx="${x + w / 2}" cy="${base - h / 2}" r="${w * .9}" fill="#ffd98a" opacity=".07"/>`;
      return s2;
    };
    b += house(96, 252, 30, 20, "#5a3426", [[5, 7, 7, 7], [18, 7, 7, 7]]);
    b += house(134, 246, 24, 18, "#4a2e3e", [[8, 6, 8, 7]]);
    /* 工房（いちばん大きな建物。煙突から細い煙） */
    b += `<rect x="236" y="208" width="8" height="18" fill="#3a2420"/><path d="M240 206C236 196 246 190 240 180C236 172 244 166 242 158" fill="none" stroke="#dfe6f5" stroke-width="2" opacity=".35" stroke-linecap="round"/>`;
    b += house(186, 256, 64, 32, "#6a2a2a", [[8, 10, 10, 12], [27, 8, 11, 24], [46, 10, 10, 12]]);
    b += `<path d="M213 232h11" stroke="#7a4a22" stroke-width=".8"/>`;
    b += house(272, 252, 28, 20, "#3a3a5a", [[6, 7, 7, 7], [16, 7, 7, 7]]);
    b += house(310, 258, 22, 16, "#5a3426", [[8, 5, 7, 6]]);
    /* 灯りの小道とガーランド */
    b += garland(126, 236, 186, 232, 6, 8, ["#ffe08a", "#ff9a8a"]) + garland(250, 232, 300, 234, 6, 7, ["#ffe08a", "#fff3c4"]);
    b += `<path d="M150 300Q190 270 218 258" fill="none" stroke="#ffe7a8" stroke-width="1.2" stroke-dasharray="1 5" opacity=".7" stroke-linecap="round"/>`;
    for (let i = 0; i < 5; i++) b += glowDot(160 + i * 13, 292 - i * 8, 1.4, "#ffe3a0", .9);
    b += fallingSnow(rng, 34);
    b += `<rect width="400" height="300" fill="url(#${vg})"/>`;
    return `<svg viewBox="0 0 400 300" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><defs>${defs}</defs>${b}</svg>`;
  };

  /* ============ ⑤ 光る地球儀（世界一周のお祝い） ============ */
  const globe = () => {
    const a = uid("gl"), bg = uid("gb"), gg = uid("gg");
    let lines = "";
    [14, 40, 62].forEach((rx) => { lines += `<ellipse cx="100" cy="100" rx="${rx}" ry="80" fill="none" stroke="#f3d98f" stroke-width=".7" opacity=".45"/>`; });
    lines += `<line x1="100" y1="20" x2="100" y2="180" stroke="#f3d98f" stroke-width=".7" opacity=".45"/>`;
    for (let i = 1; i < 6; i++) { const y = 100 - 80 * Math.cos((i * Math.PI) / 6); const rx = 80 * Math.sin((i * Math.PI) / 6); lines += `<ellipse cx="100" cy="${f1(y)}" rx="${f1(rx)}" ry="${f1(rx * .16)}" fill="none" stroke="#f3d98f" stroke-width=".7" opacity=".45"/>`; }
    return `<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><defs>
      <radialGradient id="${a}" cx=".38" cy=".34" r=".75"><stop offset="0" stop-color="#4a86c0"/><stop offset=".55" stop-color="#1c3f74"/><stop offset="1" stop-color="#0b1838"/></radialGradient>
      <radialGradient id="${bg}" cx=".5" cy=".5" r=".5"><stop offset=".6" stop-color="#ffe3a0" stop-opacity=".45"/><stop offset="1" stop-color="#ffe3a0" stop-opacity="0"/></radialGradient>
      ${goldGrad(gg, true)}</defs>
      <circle cx="100" cy="100" r="98" fill="url(#${bg})"/>
      <circle cx="100" cy="100" r="80" fill="url(#${a})"/>
      <path d="M58 62C70 52 86 56 92 66C98 76 88 84 92 96C96 106 84 116 74 110C64 104 62 92 54 86C46 80 48 70 58 62Z" fill="#2f8a62" opacity=".75"/>
      <path d="M112 54C124 48 140 52 146 62C150 70 144 76 150 84C156 92 150 104 140 102C132 100 128 92 120 90C112 88 104 80 106 70C107 62 106 58 112 54Z" fill="#2f8a62" opacity=".7"/>
      <path d="M118 112C128 108 140 114 140 126C140 138 130 150 120 148C112 146 110 136 112 128C113 120 112 116 118 112Z" fill="#2f8a62" opacity=".7"/>
      <path d="M70 124C78 120 86 126 84 136C82 146 74 150 68 144C63 138 64 128 70 124Z" fill="#2f8a62" opacity=".65"/>
      ${lines}
      <circle cx="100" cy="100" r="80" fill="none" stroke="url(#${gg})" stroke-width="2.4"/>
      <path d="M66 50A44 44 0 0 1 104 30" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity=".35"/>
      <ellipse cx="100" cy="100" rx="96" ry="26" fill="none" stroke="url(#${gg})" stroke-width="1.6" transform="rotate(-18 100 100)" opacity=".9"/>
      <polygon points="${starPts(184, 72, 5, 7, 3)}" fill="url(#${gg})"/>
      ${sparkle(26, 136, 5, "#fff3c4")}${sparkle(170, 150, 4, "#fff3c4")}
      </svg>`;
  };

  /* 区切りかざり */
  const divider = () => `<svg viewBox="0 0 200 14" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" preserveAspectRatio="xMidYMid meet"><path d="M8 7H84M116 7H192" stroke="${GOLD}" stroke-width=".9"/><path d="M84 7Q92 1 100 7Q108 13 116 7" fill="none" stroke="${GOLD}" stroke-width=".9"/><polygon points="${starPts(100, 7, 4, 5, 1.8)}" fill="${GOLD}"/><circle cx="8" cy="7" r="1.4" fill="${GOLD}"/><circle cx="192" cy="7" r="1.4" fill="${GOLD}"/></svg>`;

  const toDataUrl = (svg) => "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);

  return { fortuneSymbol, luckyIcon, stamp, stampInk, secretStamp, postcard, globe, divider, toDataUrl, starPts, esc };
})();
