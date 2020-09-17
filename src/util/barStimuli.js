export function createBarStimulus(
  barScaleFactor,
  barColor,
  barRotation,
  boxSize = 40,
  additionalClassName = ""
) {
  const element = document.createElement("div");
  element.className = "bar-stimulus " + additionalClassName;
  element.setAttribute("width", boxSize);
  element.setAttribute("height", boxSize);

  const bar = document.createElement("div");
  bar.className = "bar";
  bar.style.transform = `translate(-50%, -50%) rotate(${barRotation}deg) scale(${barScaleFactor})`;
  bar.style.backgroundColor = barColor;
  element.appendChild(bar);

  return element;
}

export function createBarStimulusGrid(
  gridSize, // [x, y]
  targetCoordinates, // [x, y] (from 0 to gridSize -1)
  targetColor,
  distractorColor,
  targetScaleFactor,
  distractorScaleFactor = 0.8,
  distractorScaleFactorStandardDeviation = 0,
  targetRotation = 0,
  distractorRotation = targetRotation,
  barBoxSize = 40
) {
  const container = document.createElement("div");
  container.className = "bar-stimulus-grid ";
  container.style.display = "grid";
  container.style.gridTemplateColumns = `repeat(${gridSize[0]}, ${barBoxSize}px)`;
  container.style.gridTemplateRows = `repeat(${gridSize[1]}, ${barBoxSize}px)`;

  let x, y;
  let target;
  for (x = 0; x < gridSize[0]; x++) {
    for (y = 0; y < gridSize[1]; y++) {
      let currentBar;
      if (x == targetCoordinates[0] && y == targetCoordinates[1]) {
        currentBar = createBarStimulus(
          targetScaleFactor,
          targetColor,
          targetRotation,
          barBoxSize,
          "bar-stimulus-grid-target"
        );
        target = currentBar;
      } else {
        const scaleFactor =
          distractorScaleFactor + (Math.random() * 2 - 1) * distractorScaleFactorStandardDeviation;
        currentBar = createBarStimulus(
          scaleFactor,
          distractorColor,
          distractorRotation,
          barBoxSize,
          "bar-stimulus-grid-distractor"
        );
      }

      currentBar.style.gridColumn = x + 1;
      currentBar.style.gridRow = y + 1;
      container.appendChild(currentBar);
    }
  }

  return [container, target.querySelector(".bar")];
}
