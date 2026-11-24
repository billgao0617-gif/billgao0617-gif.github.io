export function ease(value, start, end) {
  const t = Math.min(1, Math.max(0, (value - start) / (end - start)));
  return t * t * (3 - 2 * t);
}

export const voiceStart = .558;
export const tetherStart = .776;

const transmissionAt = .772;
const transmissionDuration = .34;
const fasteningDuration = .18;
const finalHold = .06;

// Insert the cutaway and fastening scene after the voice demonstration.
export function storyProgress(frame, scrollProgress) {
  const inserted = transmissionDuration + fasteningDuration;
  const elapsed = scrollProgress * (1 + inserted + finalHold);
  const local = elapsed - transmissionAt;
  frame.transmissionTime = local/transmissionDuration;
  frame.fasteningTime = (local-transmissionDuration)/fasteningDuration;
  const paused = Math.max(0,Math.min(inserted,local));
  return Math.min(1,elapsed-paused);
}

// Camera fit in the EVA photograph's pixel coordinates. The CAD socket and
// grip are registered against the station bolt and the glove, respectively.
export const evaCamera = {
  width: 1672, height: 941, x: 692.26, y: 246.907, focal: 2200,
  yaw: 2.760, elevation: .4244, bank: -.03528, distance: 1.01033,
  ferruleX: 622, ferruleY: 344
};

const displayWake = .590;
const displayWords = .659;
const voiceActStart = .699;
const voiceActEnd = .764;

function jawCycle(progress, start, open, hold, closed) {
  return ease(progress, start, open) * (1 - ease(progress, hold, closed));
}

export function positionStoryParts(frame, progress) {
  const driverOut = ease(progress, .168, .193);
  const pliersIn = ease(progress, .197, .223);
  const pliersOut = ease(progress, .332, .354);
  const scissorsIn = ease(progress, .358, .382);
  const scissorsOut = ease(progress, .493, .516);
  const pliersReturn = ease(progress, .520, .547);
  const fasten = frame.fasteningTime;
  const returnDriver = ease(fasten,.14,.32);
  const removePliers = ease(fasten,.02,.15);
  frame.heads.driver = .42 * driverOut * (1-returnDriver);
  frame.heads.pliers = .42 * (1 - pliersIn + pliersOut * (1 - pliersReturn) + removePliers);
  frame.heads.scissors = .42 * (1 - scissorsIn + scissorsOut);

  // These cycles run only during locked dwells at their native mating poses.
  frame.open.pliers = .25 * (
    jawCycle(progress,.229,.247,.253,.271) + jawCycle(progress,.279,.295,.302,.323) +
    jawCycle(progress,voiceActStart,.721,.732,voiceActEnd)
  );
  frame.open.scissors = .23 * (jawCycle(progress,.388,.406,.412,.433) + jawCycle(progress,.441,.456,.464,.483));
  frame.unlock = Math.max(
    jawCycle(progress,.156,.170,.215,.227),
    jawCycle(progress,.326,.334,.374,.386),
    jawCycle(progress,.487,.494,.538,.553),
    jawCycle(fasten,.018,.105,.283,.36)
  );

  const transmission = frame.transmissionTime;
  frame.cutaway = jawCycle(transmission,.05,.15,.86,.97);
  frame.open.pliers += .21 * (
    jawCycle(transmission,.17,.235,.273,.364) +
    jawCycle(transmission,.387,.456,.494,.585) +
    jawCycle(transmission,.607,.677,.715,.819)
  );
  frame.fastener = jawCycle(fasten,.26,.44,.93,.998);
  frame.seating = ease(fasten,.535,.815);
  frame.fastenerSpin = 4 * Math.PI * frame.seating;
  const engagement = ease(fasten,.44,.535) * (1-ease(fasten,.87,.95));
  frame.advance = engagement * (.009 + .011 * frame.seating);
  frame.driverSpin = 1.65 * Math.PI * ease(progress,.113,.165) + frame.fastenerSpin;
  frame.driveGear = frame.driverSpin - 4.1 * (frame.open.pliers + frame.open.scissors);
  frame.wave = ease(progress, displayWake, .601) * (1-ease(progress,.647,.677));
  frame.voiceTime = (progress - displayWake) / (.677 - displayWake);
  frame.screenAlpha = ease(progress,displayWords,.671) * (1-ease(progress,.787,.806))
    * (1-ease(fasten,.03,.17));
  frame.lcd = progress < displayWords ? -1 : progress < voiceActStart ? 0 : progress < voiceActEnd ? 1 : 2;
  frame.actionProgress = ease(progress, voiceActStart, voiceActEnd);
  frame.ringVisible = progress >= .778;
  frame.ringRise = ease(progress,.778,.818);
  frame.ring = ease(progress,.810,.848);
  frame.clipVisible = progress >= .846;
  frame.clip = ease(progress,.865,.897);
  frame.gate = jawCycle(progress,.846,.865,.897,.910);
  frame.tether = ease(progress,.911,.936);
  frame.pull = .006 * ease(progress,.926,.943);
  frame.wakePhase = progress < displayWake ? 0 : progress < displayWords ? 1 : progress < voiceActEnd ? 2 : 3;
}

export function attachmentAt(progress) {
  if (progress < .225) return 0;
  if (progress < .384 || progress >= .550) return 1;
  return 2;
}
