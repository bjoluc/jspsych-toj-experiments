import { Howl } from "howler";

/**
 * Plays a sound file from a provided URL
 *
 * @param {string} url The URL to load the sound file from
 */
export function playAudio(url) {
  return new Promise((resolve) => {
    new Howl({
      src: [url],
      autoplay: true,
      onend: resolve,
    });
  });
}
