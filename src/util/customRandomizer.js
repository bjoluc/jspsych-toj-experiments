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