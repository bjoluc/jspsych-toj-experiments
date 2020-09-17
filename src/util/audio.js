export function playAudio(url) {
  return new Promise((resolve) => {
    const audio = new Audio(url);
    audio.play();
    audio.onended = resolve;
  });
}
