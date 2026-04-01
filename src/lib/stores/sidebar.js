import { writable } from 'svelte/store';
import { browser } from '$app/environment';

function createSidebarStore() {
  const isMobile = browser ? window.innerWidth < 768 : false;
  const { subscribe, set, update } = writable(isMobile ? false : true);

  return {
    subscribe,
    open: () => set(true),
    close: () => set(false),
    toggle: () => update((n) => !n),
  };
}

export const sidebarStore = createSidebarStore();
