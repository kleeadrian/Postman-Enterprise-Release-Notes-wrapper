(function () {
  // On localhost, use the Node proxy for live data.
  // Everywhere else (GitHub Pages, etc.), use the static snapshot refreshed by CI.
  const isLocal = /^(localhost|127\.0\.0\.1|\[?::1\]?)$/.test(location.hostname);
  const NOTES_URL = isLocal ? "/api/notes" : "./notes.json";
  const state = { notes: [], selected: null };

  const el = {
    list: document.getElementById("version-list"),
    content: document.getElementById("content"),
    search: document.getElementById("version-search"),
  };

  marked.setOptions({ gfm: true, breaks: false, headerIds: false, mangle: false });

  // Strip enterprise suffix: "12.28.0-enterprise01" -> "12.28.0"
  function cleanVersion(v) {
    return v.replace(/-enterprise\d+$/i, "");
  }

  // Extract the first date from the markdown content, e.g. "September 18, 2026"
  function extractDate(md) {
    if (!md) return null;
    const m = md.match(
      /\b(January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},\s+\d{4}\b/,
    );
    return m ? m[0] : null;
  }

  // Strip leading version/date lines from the markdown before rendering the body,
  // since we render those in the header.
  function stripHeader(md, cleanV, date) {
    if (!md) return "";
    const lines = md.split("\n");
    let i = 0;
    // Drop leading blank lines
    while (i < lines.length && lines[i].trim() === "") i++;
    // Drop the "## Postman X.Y.Z" heading if present
    if (i < lines.length && /^#{1,3}\s+Postman\b/i.test(lines[i])) i++;
    // Drop blank lines
    while (i < lines.length && lines[i].trim() === "") i++;
    // Drop the date line if it matches the extracted date
    if (
      i < lines.length &&
      date &&
      lines[i].trim().toLowerCase() === date.toLowerCase()
    )
      i++;
    while (i < lines.length && lines[i].trim() === "") i++;
    return lines.slice(i).join("\n");
  }

  function renderSidebar(filter) {
    const q = (filter || "").trim().toLowerCase();
    el.list.innerHTML = "";
    state.notes.forEach((n, idx) => {
      const label = n.cleanVersion;
      if (q && !label.toLowerCase().includes(q)) return;

      const a = document.createElement("a");
      a.className = "version-item" + (idx === state.selected ? " active" : "");
      if (!n.hasContent) a.classList.add("empty");
      a.href = "#" + encodeURIComponent(n.cleanVersion);
      a.dataset.idx = String(idx);

      const num = document.createElement("span");
      num.className = "v-num";
      num.textContent = label;
      a.appendChild(num);

      if (n.date) {
        const d = document.createElement("span");
        d.className = "v-date";
        d.textContent = n.date;
        a.appendChild(d);
      } else if (!n.hasContent) {
        const tag = document.createElement("span");
        tag.className = "v-tag";
        tag.textContent = "No notes";
        a.appendChild(tag);
      }

      a.addEventListener("click", (ev) => {
        ev.preventDefault();
        selectVersion(idx, true);
      });
      el.list.appendChild(a);
    });
  }

  function renderContent(idx) {
    const note = state.notes[idx];
    if (!note) {
      el.content.innerHTML = '<div class="empty-state">Select a version.</div>';
      return;
    }

    const body = stripHeader(note.content, note.cleanVersion, note.date);
    const html = body ? DOMPurify.sanitize(marked.parse(body)) : "";

    const wrap = document.createElement("div");
    wrap.className = "release";
    wrap.innerHTML = `
      <header class="release-header">
        <span class="release-version">v${escapeHtml(note.cleanVersion)}</span>
        <h1 class="release-title">Postman ${escapeHtml(note.cleanVersion)}</h1>
        ${note.date ? `<div class="release-date">${escapeHtml(note.date)}</div>` : ""}
      </header>
      <article class="markdown">
        ${
          html
            ? html
            : `<div class="empty-state">No release notes were published for this version.</div>`
        }
      </article>
    `;

    // Make all in-body links open in a new tab
    el.content.innerHTML = "";
    el.content.appendChild(wrap);
    wrap.querySelectorAll("a[href^='http']").forEach((a) => {
      a.setAttribute("target", "_blank");
      a.setAttribute("rel", "noopener noreferrer");
    });
  }

  function escapeHtml(s) {
    return String(s).replace(
      /[&<>"']/g,
      (c) =>
        ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c],
    );
  }

  function selectVersion(idx, pushHash) {
    state.selected = idx;
    renderSidebar(el.search.value);
    renderContent(idx);
    if (pushHash) {
      const v = state.notes[idx].cleanVersion;
      history.replaceState(null, "", "#" + encodeURIComponent(v));
    }
    el.content.scrollTop = 0;
    window.scrollTo({ top: 0, behavior: "instant" in window ? "instant" : "auto" });
  }

  function selectByHash() {
    const hash = decodeURIComponent(location.hash.replace(/^#/, ""));
    if (!hash) return false;
    const idx = state.notes.findIndex((n) => n.cleanVersion === hash);
    if (idx >= 0) {
      selectVersion(idx, false);
      return true;
    }
    return false;
  }

  function pickInitial() {
    if (selectByHash()) return;
    // Default: first version that actually has content
    const idx = state.notes.findIndex((n) => n.hasContent);
    selectVersion(idx >= 0 ? idx : 0, false);
  }

  async function load() {
    try {
      const res = await fetch(NOTES_URL, { cache: "no-store" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const raw = Array.isArray(data.notes) ? data.notes : [];
      state.notes = raw.map((n) => {
        const cleanV = cleanVersion(n.version);
        const date = extractDate(n.content);
        return {
          version: n.version,
          cleanVersion: cleanV,
          content: n.content || "",
          date,
          hasContent: !!(n.content && n.content.trim()),
        };
      });

      renderSidebar("");
      pickInitial();
    } catch (err) {
      el.content.innerHTML = `
        <div class="error">
          <strong>Couldn't load release notes.</strong><br />
          ${escapeHtml(err.message)}<br /><br />
          Make sure the local proxy is running: <code>node server.js</code>
        </div>`;
    }
  }

  el.search.addEventListener("input", (e) => renderSidebar(e.target.value));
  window.addEventListener("hashchange", selectByHash);

  // Theme toggle: light <-> dark, persisted in localStorage.
  const themeBtn = document.getElementById("theme-toggle");
  if (themeBtn) {
    themeBtn.addEventListener("click", () => {
      const current = document.documentElement.getAttribute("data-theme") || "light";
      const next = current === "dark" ? "light" : "dark";
      document.documentElement.setAttribute("data-theme", next);
      localStorage.setItem("theme", next);
    });
  }
  // Follow the OS if the user hasn't picked a theme explicitly.
  if (window.matchMedia) {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    mq.addEventListener("change", (e) => {
      if (!localStorage.getItem("theme")) {
        document.documentElement.setAttribute(
          "data-theme",
          e.matches ? "dark" : "light",
        );
      }
    });
  }

  load();
})();
