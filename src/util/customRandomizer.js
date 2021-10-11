import randomInt from "random-int";
export function partialRandomizePartialRandomizeSequencewise(factors,repetitions, patternList,randomizedSequenceWise, values){
  delete factors[randomizedSequenceWise]
  let trials = jsPsych.randomization.factorial(factors, repetitions);

  let singleTrialIdx = 0 
  let restSequenceCount = 0
  let currentValueIdx = randomInt(0,values.length - 1)
  let value = undefined
  let prevValue = undefined

  while(singleTrialIdx < trials.length){

    if(restSequenceCount === 0){
      restSequenceCount = patternList[randomInt(0,patternList.length - 1)]
      value = values[currentValueIdx]
      prevValue = currentValueIdx
      while(currentValueIdx === prevValue)
        currentValueIdx = randomInt(0,values.length - 1)
    }

    trials[singleTrialIdx][randomizedSequenceWise] = value
    singleTrialIdx = singleTrialIdx + 1
    restSequenceCount = restSequenceCount - 1
  }
  return trials
}
export function exactPartialRandomizePartialRandomizeSequencewise(factors,repetitions, patternList,randomizedSequenceWise, values, lastValue = null){
  delete factors[randomizedSequenceWise]
  let trials = jsPsych.randomization.factorial(factors, repetitions);

  let singleTrialIdx = 0 
  let restSequenceCount = 0
  const sequence = oneNeededGenerateSequence(patternList,trials.length)
  let currentValueIdx = randomInt(0,values.length-1)
  if(lastValue != null){
    const choiceValues = values.filter((v) => v !== lastValue)
    const randomOtherValue = values[randomInt(0,choiceValues.length-1)]
    currentValueIdx = values.indexOf(randomOtherValue)
  }
  let sequenceIdx = 0;
  let value = undefined
  let prevValue = undefined


  while(singleTrialIdx < trials.length){

    if(restSequenceCount === 0){
      restSequenceCount = sequence[sequenceIdx]
      sequenceIdx = sequenceIdx + 1
      value = values[currentValueIdx]
      prevValue = currentValueIdx
      while(currentValueIdx === prevValue)
        currentValueIdx = randomInt(0,values.length - 1)
    }

    trials[singleTrialIdx][randomizedSequenceWise] = value
    singleTrialIdx = singleTrialIdx + 1
    restSequenceCount = restSequenceCount - 1
  }
  return trials
}

// smallest step must be one otherwise greedy choice will not work
function oneNeededGenerateSequence(patterns, sum, currentSequence = []){
  if(sum === 0){
    return currentSequence
  } else{
    const possiblePatterns = patterns.filter((a) => a <= sum)
    const choice = possiblePatterns[randomInt(0,possiblePatterns.length-1)]
    currentSequence.push(choice)
    return oneNeededGenerateSequence(patterns, sum-choice,currentSequence)
  }

}
