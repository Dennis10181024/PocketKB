'use strict';

const target = document.querySelector('#play-root');
const choice = PocketChoiceView.create(render, { choiceOnly: true });
const connectivity = document.querySelector('#play-connectivity');

function render() {
  target.innerHTML = choice.render(true);
  choice.bind();
}

render();

if (navigator.serviceWorker && window.isSecureContext) {
  connectivity.textContent = '正在準備離線資料';
  navigator.serviceWorker.register('./play-sw.js', { scope: './play.html' })
    .then(() => navigator.serviceWorker.ready)
    .then(() => { connectivity.textContent = '可離線遊玩'; })
    .catch(() => { connectivity.textContent = '離線資料尚未備妥'; });
} else {
  connectivity.textContent = '區網試玩 · 請保持 Wi-Fi 連線';
}
