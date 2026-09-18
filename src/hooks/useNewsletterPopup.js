import { useEffect, useState } from 'react';

const DELAY = 3 * 60 * 1000;
const FIRST_VISIT_KEY = 'longlife.newsletter.first-visit.v1';
const SHOWN_KEY = 'longlife.newsletter.shown.v1';

// Keep the page usable when browser storage is unavailable.
let firstVisitInMemory;
let shownInMemory = false;

function read(key) {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function write(key, value) {
  try {
    localStorage.setItem(key, String(value));
  } catch {
    // The in-memory values still prevent repeats during this page visit.
  }
}

function firstVisit() {
  const saved = Number(read(FIRST_VISIT_KEY));
  const now = Date.now();
  if (saved > 0 && Number.isFinite(saved) && saved <= now) return saved;
  if (!firstVisitInMemory) {
    firstVisitInMemory = now;
    write(FIRST_VISIT_KEY, now);
  }
  return firstVisitInMemory;
}

function hasShown() {
  return shownInMemory || read(SHOWN_KEY) === '1';
}

function rememberShown() {
  shownInMemory = true;
  write(SHOWN_KEY, '1');
}

export default function useNewsletterPopup({ subscribed, blocked }) {
  const [showPopup, setShowPopup] = useState(false);
  const [popupDone, setPopupDone] = useState(false);

  useEffect(() => {
    const startedAt = firstVisit();
    if (subscribed || popupDone) {
      rememberShown();
      return;
    }
    if (showPopup) return;

    let cancelled = false;
    let timer;
    const claimDisplay = () => {
      if (cancelled || blocked || document.visibilityState !== 'visible' || hasShown()) return;
      // Remember on display, so even refreshing while the popup is open won't repeat it.
      rememberShown();
      setShowPopup(true);
    };
    const display = async () => {
      // Coordinate tabs that reach the deadline together where Web Locks is available.
      if (navigator.locks?.request) {
        try {
          await navigator.locks.request(SHOWN_KEY, claimDisplay);
        } catch {
          claimDisplay();
        }
      } else {
        claimDisplay();
      }
    };
    const schedule = () => {
      clearTimeout(timer);
      if (cancelled || blocked || document.visibilityState !== 'visible' || hasShown()) return;
      timer = setTimeout(display, Math.max(0, startedAt + DELAY - Date.now()));
    };
    const syncTabs = (event) => {
      if (event.key === SHOWN_KEY || event.key === FIRST_VISIT_KEY) schedule();
    };
    document.addEventListener('visibilitychange', schedule);
    window.addEventListener('storage', syncTabs);
    schedule();
    return () => {
      cancelled = true;
      clearTimeout(timer);
      document.removeEventListener('visibilitychange', schedule);
      window.removeEventListener('storage', syncTabs);
    };
  }, [subscribed, popupDone, showPopup, blocked]);

  return { showPopup, setShowPopup, popupDone, setPopupDone };
}
