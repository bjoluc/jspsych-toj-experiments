// source: https://stackoverflow.com/a/25921504/
export function copy(object) {
  let out, v, key;
  out = Array.isArray(object) ? [] : {};
  for (key in object) {
    v = object[key];
    out[key] = typeof v === "object" && v !== null ? copy(v) : v;
  }
  return out;
}

function generateSequencesAlternating(factors, repetitions = 1, probeLeftIsFactor = false) {
  let factorsCopy = copy(factors);

  const asserted = 0;
  const negated = 1;

  // if probeLeft should be assigned randomly insead of being a factor, remove it from the factor list
  if (probeLeftIsFactor) {
    factorsCopy["probeLeft"] = [true, false];
  } else {
    delete factorsCopy["probeLeft"];
  }

  // remove isInstructionNegated as a factor to create a cartesian product for a set of experimental conditions for each assertion and negation. Makes alternating between asserting + negation easier
  let sequences = [];
  factorsCopy["isInstructionNegated"] = [false];
  sequences.push(jsPsych.randomization.factorial(factorsCopy, repetitions)); // asserted utterances have index 0
  factorsCopy["isInstructionNegated"] = [true];
  sequences.push(jsPsych.randomization.factorial(factorsCopy, repetitions)); // negated utterances have index 0

  // assign probeLeft randomly if it is not being factored in the cartesian product
  if (!probeLeftIsFactor) {
    sequences[asserted].forEach((element) => {
      element["probeLeft"] = Math.random < 0.5 ? [true] : [false];
    });
    sequences[negated].forEach((element) => {
      element["probeLeft"] = Math.random < 0.5 ? [true] : [false];
    });
  }

  // shuffle sequences
  sequences[asserted] = jsPsych.randomization.repeat(sequences[asserted], 1);
  sequences[negated] = jsPsych.randomization.repeat(sequences[negated], 1);

  // zip the two sequence lists
  let startWithNegation = Math.random < 0.5;
  let sequencesAlternating = [];
  for (let i = 0; i < sequences[asserted].length; i++) {
    if (startWithNegation) {
      sequencesAlternating.push(sequences[negated][i]);
      sequencesAlternating.push(sequences[asserted][i]);
    } else {
      sequencesAlternating.push(sequences[asserted][i]);
      sequencesAlternating.push(sequences[negated][i]);
    }
  }
  return sequencesAlternating;
}
/**
 * Generates trial blocks that have length `blocksize` to `blocksize + (max(sequencelength))`
 * @param {*} trialSequences
 * @param {*} factors
 * @param {*} blocksize
 * @param {*} alwaysStayUnderBlockSize
 * @returns
 */
export function sequencesToTrials(
  trialSequences,
  factors,
  blocksize = 40,
  alwaysStayUnderBlockSize = false,
  repetitions = 1,
  probeLeftIsFactor = false
) {
  if (alwaysStayUnderBlockSize) {
    throw "alwaysStayUnderBlockSize===true is not implemented yet";
  }

  /**
   * SOA distribution upon trials. SOAs are not distributed uniformly random over all trials but randomly distributed under the conditions
   * - isNegated? AND
   * - sequence length AND
   * - rank (i.e. position of the trial within the sequence)
   */

  const cloneArrayAndShuffle = function (
    source,
    count,
    repetitions = 1,
    probeLeftIsFactor = false
  ) {
    let res = [];
    let reps = repetitions + (probeLeftIsFactor ? 1 : 0);
    let shuffled = jsPsych.randomization.repeat(source, reps);
    for (let rank = 0; rank < count; rank++) {
      // I have no idea whether the same seed is used for each shuffle; so better safe than sorry by shuffling the already shuffled SOA list
      shuffled = jsPsych.randomization.repeat(shuffled, 1);
      res.push(shuffled);
    }
    return res;
  };

  const asserted = 0;
  const negated = 1;
  let soas = [{}, {}];

  // SOA list generation for later to pick from
  for (let i = 0; i < factors.sequenceLength.length; i++) {
    // use actual sequence length as key
    // for each uatterance, sequence length and rank: add a list of shuffled soas
    let sequenceLength = factors.sequenceLength[i].toString();
    soas[asserted][sequenceLength] = cloneArrayAndShuffle(
      factors.soa,
      sequenceLength,
      repetitions,
      probeLeftIsFactor
    );
    soas[negated][sequenceLength] = cloneArrayAndShuffle(
      factors.soa,
      sequenceLength,
      repetitions,
      probeLeftIsFactor
    );
  }

  let blockIndex = 0;
  let trialIndexInBlock = 0;
  let trials = [];
  let trialCount = 0;

  for (let i = 0; i < trialSequences.length; i++) {
    if (alwaysStayUnderBlockSize && trialSequences[i] > blocksize) {
      console.warn(
        "A sequence is larger than the permitted block size. A block with the size of the sequence was generated nevertheless."
      );
    }
    for (let rank = 0; rank < trialSequences[i].sequenceLength; rank++) {
      let sequenceLength = trialSequences[i].sequenceLength.toString();
      let neg = trialSequences[i].isInstructionNegated ? 1 : 0;
      trialSequences[i].soa = soas[neg][sequenceLength][rank].pop();
      trialSequences[i]["blockIndex"] = blockIndex;
      trialSequences[i]["rank"] = rank;
      trialSequences[i]["trialIndex"] = trialCount;
      trialSequences[i]["trialIndexInBlock"] = trialIndexInBlock;
      trials.push(copy(trialSequences[i]));
      trialCount++;
      trialIndexInBlock++;
    }
    /**
    // peek into next sequence. End block prematurely if block size in the next iteration is expected to be larger than the threshold
    // hier gibt es einen array out of bounds exception beim i!
    if (alwaysStayUnderBlockSize && currentBlocksize + trialSequences[i] > blocksize) {
      currentBlocksize = 0;
      blockcount++;
      trials.push(blockEnd);
    } 
    */
    // end block
    if (!alwaysStayUnderBlockSize && trialIndexInBlock >= blocksize) {
      trialIndexInBlock = 0;
      blockIndex++;
    }
  }
  return {
    trials: trials,
    blockCount: trials[trials.length - 1].blockIndex + 1,
  };
}

export function generateAlternatingSequences(
  factors,
  repetitions,
  probeLeftIsFactor,
  blocksize,
  alwaysStayUnderBlockSize
) {
  let trialSequences = generateSequencesAlternating(factors, repetitions, probeLeftIsFactor);

  return sequencesToTrials(
    trialSequences,
    factors,
    blocksize,
    alwaysStayUnderBlockSize,
    repetitions,
    probeLeftIsFactor
  );
}
