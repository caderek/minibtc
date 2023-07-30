// @ts-ignore
import type { PWAInstallElement } from "@khmyznikov/pwa-install";
// @ts-ignore
import isMobile from "is-mobile";
import { $box, $install } from "./dom";

const registerHandlers = () => {
  /* Handle embed mode */
  const params = new URLSearchParams(location.search);

  if (params.get("embed") === "true") {
    document.body.classList.add("embed");

    if (params.get("theme") === "light") {
      document.body.classList.add("light");
    }

    return;
  }

  /* Handle dark mode switch */

  if (localStorage.getItem("mode") === "light") {
    document.body.classList.toggle("light");
  }

  const toggleDarkMode = () => {
    document.body.classList.toggle("light");
    localStorage.setItem(
      "mode",
      document.body.classList.contains("light") ? "light" : "dark"
    );
  };

  document.getElementById("mode")!.addEventListener("click", toggleDarkMode);

  /* Handle PWA install on mobile */

  const isStandalone = () => {
    return (
      window.matchMedia("(display-mode: standalone)").matches ||
      ("standalone" in navigator && (navigator as any).standalone === true)
    );
  };

  if (isMobile() && !isStandalone()) {
    $install.hidden = false;

    setTimeout(() => {
      $install.classList.add("go");
    }, 2000);

    $install.addEventListener("click", () => {
      $install.classList.add("wait");
      $install.classList.remove("go");
      // @ts-ignore
      import("@khmyznikov/pwa-install").then(() => {
        const $pwaInstall = document.querySelector(
          "pwa-install"
        ) as unknown as PWAInstallElement;

        $pwaInstall.showDialog();
        $install.classList.remove("wait");
      });
    });
  }

  /* Handle fullscreen and shortcuts on desktop */

  if (!isMobile()) {
    const $fullscreen = document.getElementById(
      "fullscreen"
    ) as HTMLButtonElement;

    $fullscreen.hidden = false;

    const toggleFullscreen = () => {
      if (!document.fullscreenElement) {
        $box.requestFullscreen();
        $fullscreen.classList.add("off");
      } else {
        document.exitFullscreen();
        $fullscreen.classList.remove("off");
      }
    };

    window.addEventListener("resize", () => {
      if (!document.fullscreenElement) {
        $fullscreen.classList.remove("off");
      }
    });

    document.addEventListener("keydown", (e) => {
      if (e.key === "F11" || e.key === "f") {
        e.preventDefault();
        toggleFullscreen();
      } else if (e.key === "m") {
        toggleDarkMode();
      }
    });

    $fullscreen.addEventListener("click", toggleFullscreen);
  }
};

export default registerHandlers;
