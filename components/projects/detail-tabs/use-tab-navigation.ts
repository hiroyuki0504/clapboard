"use client";

import { useEffect, useState } from "react";
import {
  type TabKey,
  getTabFromSearch,
  getTabFromValue,
  isTabKey,
  tabs,
} from "./tab-config";

export function useTabNavigation(initialTab?: string) {
  const [activeTab, setActiveTab] = useState<TabKey>(() =>
    getTabFromValue(initialTab),
  );

  useEffect(() => {
    function syncTabFromUrl() {
      setActiveTab(getTabFromSearch());
    }

    syncTabFromUrl();
    window.addEventListener("popstate", syncTabFromUrl);

    return () => window.removeEventListener("popstate", syncTabFromUrl);
  }, []);

  useEffect(() => {
    document
      .querySelector<HTMLButtonElement>(
        `[data-project-detail-tab="${activeTab}"]`,
      )
      ?.scrollIntoView({ block: "nearest", inline: "center" });
  }, [activeTab]);

  function selectTab(tabKey: TabKey) {
    if (tabKey === activeTab) {
      return;
    }

    setActiveTab(tabKey);

    const url = new URL(window.location.href);

    if (tabKey === "overview") {
      url.searchParams.delete("tab");
    } else {
      url.searchParams.set("tab", tabKey);
    }

    window.history.pushState(
      null,
      "",
      `${url.pathname}${url.search}${url.hash}`,
    );
  }

  function selectAndFocusTab(tabKey: TabKey) {
    selectTab(tabKey);
    window.requestAnimationFrame(() => {
      const tabButton = document.querySelector<HTMLButtonElement>(
        `[data-project-detail-tab="${tabKey}"]`,
      );

      tabButton?.scrollIntoView({ block: "nearest", inline: "center" });
      tabButton?.focus();
    });
  }

  function handleTabKeyDown(
    event: React.KeyboardEvent<HTMLButtonElement>,
    tabKey: TabKey,
  ) {
    if (!isTabKey(tabKey)) {
      return;
    }

    const currentIndex = tabs.findIndex((tab) => tab.key === tabKey);
    const lastIndex = tabs.length - 1;
    let nextIndex: number | null = null;

    if (event.key === "ArrowRight" || event.key === "ArrowDown") {
      nextIndex = currentIndex === lastIndex ? 0 : currentIndex + 1;
    } else if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
      nextIndex = currentIndex === 0 ? lastIndex : currentIndex - 1;
    } else if (event.key === "Home") {
      nextIndex = 0;
    } else if (event.key === "End") {
      nextIndex = lastIndex;
    }

    if (nextIndex === null) {
      return;
    }

    event.preventDefault();
    selectAndFocusTab(tabs[nextIndex].key);
  }

  return { activeTab, selectTab, handleTabKeyDown };
}
