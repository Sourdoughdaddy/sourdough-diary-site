  // Launch day: paste the App Store link between the quotes. Every
  // "Coming soon" on the page becomes a download button.
  var STORE_URL = "";

  (function () {
    var root = document.documentElement;

    if (STORE_URL) {
      root.dataset.store = "live";
      document.querySelectorAll("[data-store-link]").forEach(function (a) { a.href = STORE_URL; });
    }

    function setLang(lang, remember) {
      root.dataset.lang = lang;
      root.lang = lang;
      document.querySelectorAll("[data-set-lang]").forEach(function (b) {
        b.setAttribute("aria-pressed", String(b.dataset.setLang === lang));
      });
      // The screenshots are the app in that language, too.
      document.querySelectorAll("img[data-" + lang + "]").forEach(function (img) {
        var next = img.dataset[lang];
        if (img.getAttribute("src") !== next) img.src = next;
      });
      if (remember) { try { localStorage.setItem("lang", lang); } catch (e) {} }
    }

    var asked = new URLSearchParams(location.search).get("lang");
    var saved = null;
    try { saved = localStorage.getItem("lang"); } catch (e) {}
    var guess = (navigator.language || "en").toLowerCase().indexOf("de") === 0 ? "de" : "en";
    var first = asked === "de" || asked === "en" ? asked : (saved === "de" || saved === "en" ? saved : guess);
    // A published page is one language at one address; the switch is a link.
    if (!root.hasAttribute("data-static")) setLang(first, false);

    document.querySelectorAll("[data-set-lang]").forEach(function (b) {
      b.addEventListener("click", function () { setLang(b.dataset.setLang, true); });
    });

    // ---------- Google Analytics, only after a yes. Nothing from Google is
    // loaded, and no cookie is set, until the visitor accepts.
    var GA_ID = "G-05Y1MEQ9BR";
    function startAnalytics() {
      if (window.gtag || !GA_ID) return;
      window.dataLayer = window.dataLayer || [];
      window.gtag = function () { window.dataLayer.push(arguments); };
      window.gtag("js", new Date());
      window.gtag("config", GA_ID);
      var tag = document.createElement("script");
      tag.async = true;
      tag.src = "https://www.googletagmanager.com/gtag/js?id=" + GA_ID;
      document.head.appendChild(tag);
    }
    function askConsent() {
      var old = document.querySelector(".consent");
      if (old) old.remove();
      var de = root.lang === "de";
      var policy = (de && root.hasAttribute("data-static") ? "../" : "") + "privacy.html";
      var box = document.createElement("div");
      box.className = "consent";
      box.setAttribute("role", "dialog");
      box.setAttribute("aria-label", de ? "Cookies" : "Cookies");
      box.innerHTML = "<p>" + (de
        ? "Diese Website möchte Google Analytics verwenden, um zu sehen, welche Seiten gelesen werden. Dafür werden Cookies gesetzt. Die App ist davon nicht betroffen. <a href='" + policy + "'>Mehr dazu</a>"
        : "This website would like to use Google Analytics to see which pages are read. That sets cookies. The app is not affected. <a href='" + policy + "'>More</a>")
        + "</p><div><button type='button' data-answer='no'>" + (de ? "Nein danke" : "No thanks")
        + "</button><button type='button' data-answer='yes'>" + (de ? "Einverstanden" : "Accept") + "</button></div>";
      box.addEventListener("click", function (e) {
        var answer = e.target.getAttribute && e.target.getAttribute("data-answer");
        if (!answer) return;
        try { localStorage.setItem("consent", answer); } catch (err) {}
        box.remove();
        if (answer === "yes") startAnalytics();
        else if (window.gtag) location.reload();   // withdrawn: stop loading it
      });
      document.body.appendChild(box);
    }
    var consent = null;
    try { consent = localStorage.getItem("consent"); } catch (e) {}
    if (consent === "yes") startAnalytics();
    else if (consent !== "no") askConsent();
    document.querySelectorAll("[data-consent]").forEach(function (link) {
      link.addEventListener("click", function (e) { e.preventDefault(); askConsent(); });
    });

    // ---------- Starter calculator. The same sums as the app's first guess:
    // time grows with the square root of the food, and halves per 10 degrees.
    var calc = document.querySelector("[data-calc]");
    if (calc) {
      var outs = {};
      document.querySelectorAll("[data-out]").forEach(function (el) { outs[el.getAttribute("data-out")] = el; });
      var now = new Date();
      calc.fed.value = ("0" + now.getHours()).slice(-2) + ":" + ("0" + now.getMinutes()).slice(-2);
      var figure = function () {
        var need = Math.max(0, parseFloat(calc.need.value) || 0) + (calc.keep.checked ? 20 : 0);
        var r = parseInt(calc.ratio.value, 10);
        var target = Math.round(need * 1.1 * 100) / 100;
        var exact = Math.max(1, Math.ceil(target / (1 + 2 * r)));
        var starter = Math.max(exact, 10);
        var flour = Math.ceil(starter * r);
        outs.starter.textContent = starter + " g";
        outs.flour.textContent = flour + " g";
        outs.water.textContent = flour + " g";
        outs.total.textContent = (starter + 2 * flour) + " g";
        outs.min.hidden = starter === exact;
        var base = parseFloat(calc.base.value) || 4, temp = parseFloat(calc.temp.value) || 22;
        var hours = base * Math.sqrt(r) * Math.pow(2, -(temp - 22) / 10);
        var h = Math.floor(hours), m = Math.round((hours - h) * 60 / 5) * 5;
        if (m === 60) { h += 1; m = 0; }
        outs.hours.textContent = h + " h" + (m ? " " + m + " min" : "");
        var t = (calc.fed.value || "08:00").split(":");
        var peak = new Date(2000, 0, 1, +t[0], +t[1] + Math.round(hours * 60));
        outs.clock.textContent = ("0" + peak.getHours()).slice(-2) + ":" + ("0" + peak.getMinutes()).slice(-2);
      };
      calc.addEventListener("input", figure);
      figure();
    }

    var menu = document.querySelector(".menu");
    if (menu) {
      var bar = menu.parentNode;
      menu.addEventListener("click", function () {
        menu.setAttribute("aria-expanded", String(bar.classList.toggle("open")));
      });
      document.addEventListener("click", function (e) {
        if (!bar.contains(e.target)) { bar.classList.remove("open"); menu.setAttribute("aria-expanded", "false"); }
      });
    }

    // The Resources menu opens on hover and focus in CSS; a tap toggles it,
    // and Escape or a tap elsewhere closes it.
    var more = document.querySelector(".more");
    if (more) {
      var moreBtn = more.querySelector(".more-btn");
      var shut = function () { more.classList.remove("open"); moreBtn.setAttribute("aria-expanded", "false"); };
      moreBtn.addEventListener("click", function () {
        moreBtn.setAttribute("aria-expanded", String(more.classList.toggle("open")));
      });
      document.addEventListener("click", function (e) { if (!more.contains(e.target)) shut(); });
      document.addEventListener("keydown", function (e) {
        if (e.key === "Escape") { shut(); if (more.contains(document.activeElement)) document.activeElement.blur(); }
      });
    }

    // ---------- Scroll story. Layout is read once a frame and handed to
    // CSS as numbers between 0 and 1; the stylesheet does the drawing.
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    root.classList.add("sx");

    var hero = document.querySelector(".hero");
    var story = document.querySelector("[data-story]");
    // Pieces any page may carry: the iPad that tips up, the bake you
    // travel along sideways.
    var lone = document.querySelector("[data-rise]");
    var pan = document.querySelector("[data-pan]");
    var rail = pan && pan.querySelector(".pan-rail");
    var stops = pan ? [].slice.call(pan.querySelectorAll(".stop")) : [];
    function extras() {
      var h = window.innerHeight, b;
      if (lone) {
        b = lone.getBoundingClientRect();
        if (b.top < h && b.bottom > 0) {
          var v = Math.min(1, Math.max(0, (h - b.top) / (h * 0.75)));
          lone.style.setProperty("--t", (1 - Math.pow(1 - v, 3)).toFixed(4));
        }
      }
      if (pan) {
        b = pan.getBoundingClientRect();
        if (b.top < h && b.bottom > 0) {
          var pp = Math.min(1, Math.max(0, -b.top / (b.height - h)));
          var box = rail.parentNode;
          var travel = Math.max(0, rail.scrollWidth - (box.clientWidth - 2 * parseFloat(getComputedStyle(box).paddingLeft || 0)));
          rail.style.setProperty("--x", (pp * travel).toFixed(1));
          var edge = window.innerWidth * 0.62;
          stops.forEach(function (stop) {
            stop.style.setProperty("--on", stop.getBoundingClientRect().left < edge ? 1 : 0);
          });
        }
      }
    }
    if (!hero || !story) {
      if (!lone && !pan) return;
      var tick = false;
      var run = function () { tick = false; extras(); };
      var ask = function () { if (!tick) { tick = true; requestAnimationFrame(run); } };
      window.addEventListener("scroll", ask, { passive: true });
      window.addEventListener("resize", ask);
      extras();
      return;
    }
    var storyBg = story.querySelector(".story-bg");
    var stage = story.querySelector(".story-stage");
    var chapters = [].slice.call(story.querySelectorAll(".chapter"));
    var screens = [].slice.call(stage.querySelectorAll(".screens img"));
    var crumb = stage.querySelector(".crumb");
    var rise = document.querySelector("[data-rise]");
    var tent = document.querySelector("[data-tent]");
    var narrow = window.matchMedia("(max-width: 860px)");
    var queued = false;

    function clamp(v) { return v < 0 ? 0 : v > 1 ? 1 : v; }
    function ease(v) { return 1 - Math.pow(1 - v, 3); }
    function span(v, from, to) { return clamp((v - from) / (to - from)); }

    function frame() {
      queued = false;
      var vh = window.innerHeight;
      var r = hero.getBoundingClientRect();
      if (r.bottom > 0) hero.style.setProperty("--p", clamp(-r.top / r.height).toFixed(4));

      r = story.getBoundingClientRect();
      if (r.top < vh && r.bottom > 0) {
        var sp = clamp(-r.top / (r.height - vh));
        stage.style.setProperty("--p", sp.toFixed(4));
        storyBg.style.setProperty("--p", sp.toFixed(4));
        chapters.forEach(function (chapter, i) {
          var c = chapter.getBoundingClientRect();
          var d = (c.top + c.height / 2 - vh / 2) / vh;
          var o = narrow.matches
            ? (d > 0 ? 1 : span(d, -0.42, -0.2))
            : span(Math.abs(d), 0.6, 0.36);
          chapter.style.setProperty("--o", ease(o).toFixed(4));
          if (i > 0) {
            var t = ease(span(c.top, vh * 0.92, vh * 0.3));
            screens[i].style.setProperty("--t", t.toFixed(4));
            if (i === 2) crumb.style.setProperty("--k", t.toFixed(4));
          }
        });
      }

      extras();
      r = rise.getBoundingClientRect();
      if (r.top < vh && r.bottom > 0) rise.style.setProperty("--t", ease(span(r.top, vh, vh * 0.25)).toFixed(4));

      r = tent.getBoundingClientRect();
      if (r.top < vh && r.bottom > 0) {
        var tp = clamp(-r.top / (r.height - vh));
        tent.style.setProperty("--c", ease(span(tp, 0, 0.5)).toFixed(4));
        tent.style.setProperty("--a", ease(span(tp, 0.28, 0.6)).toFixed(4));
        tent.style.setProperty("--b", ease(span(tp, 0.4, 0.82)).toFixed(4));
      }
    }
    function queue() { if (!queued) { queued = true; requestAnimationFrame(frame); } }
    window.addEventListener("scroll", queue, { passive: true });
    window.addEventListener("resize", queue);
    frame();
  })();
