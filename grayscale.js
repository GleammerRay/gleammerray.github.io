var documentStyle;

function enableGrayscale() {
  localStorage.setItem("grayscale", "true");
  documentStyle = document.documentElement.style;
  document.documentElement.style = "-moz-filter: grayscale(100%); -webkit-filter: grayscale(100%);  filter: grayscale(100%);";
}

function disableGrayscale() {
  localStorage.setItem("grayscale", "false");
  document.documentElement.style = documentStyle;
  documentStyle = null;
}

function toggleGrayscale() {
  if (documentStyle == null) {
    enableGrayscale();
    return;
  }
  disableGrayscale();
}

function loadGrayscale() {
  grayscale = localStorage.getItem("grayscale");
  if (grayscale == null) return;
  if (grayscale == "false") return;
  if (grayscale == "true") enableGrayscale();
}

function removeLocalStorageWannabes() {
  for (let i = 0; i != localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key == 'grayscale') continue;
    if (key == 'playerName') continue;
    localStorage.removeItem(key);
    i--;
  }
}

loadGrayscale();
removeLocalStorageWannabes();

window.onload = function () {
  setTimeout(function () {
      document.documentElement.scrollTop = 0;
      window.scrollTo(0, 0);
    },
    500
  );
}
