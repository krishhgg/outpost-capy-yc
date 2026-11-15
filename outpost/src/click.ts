import { createAudioPlayer, type AudioPlayer } from "expo-audio";

// The one short click that every game-style press makes (drawn by assets/sounds/make-swipe.mjs). One shared player,
// made on the first press, at half volume so it sits under the swipe and collect sounds.
let player: AudioPlayer | null = null;
// The tick a roof bubble makes when its number changes, from the same sounds as the post tray's pills.
let ticker: AudioPlayer | null = null;
export function tick() {
  if (!ticker) {
    ticker = createAudioPlayer(require("../assets/sounds/tick.wav"));
    ticker.volume = 0.6;
  }
  ticker.seekTo(0).catch(() => {});
  ticker.play();
}

export function click() {
  if (!player) {
    player = createAudioPlayer(require("../assets/sounds/click.wav"));
    player.volume = 0.5;
  }
  player.seekTo(0).catch(() => {});
  player.play();
}
