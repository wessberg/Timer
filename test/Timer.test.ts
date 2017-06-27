import {test} from "ava";
import {Timer} from "../src/Timer";

const WAIT_TIME = 100;

async function wait (time: number): Promise<void> {
	return new Promise<void>(resolve => setTimeout(resolve, time));
}

test.beforeEach(() => Timer.clearTimers());

test.serial(`Will call the given callback eventually and only once when interval = false. #1`, async t => {
	let calledCallbackTimes = 0;
	const timer = new Timer(() => calledCallbackTimes++, WAIT_TIME, false);
	await timer.run();
	t.true(calledCallbackTimes === 1);
});

test.serial(`Will call the given callback the appropriate amount of times when interval = true. #1`, async t => {
	let calledCallbackTimes = 0;
	const timer = new Timer(() => {
		calledCallbackTimes++;
	}, WAIT_TIME, true);
	setTimeout(() => timer.stop(), WAIT_TIME * 3.5);
	await timer.run();
	t.true(calledCallbackTimes === 3);
});

test.serial(`Will stop all running timers if requested. #1`, async t => {
	let timer1Running = false;
	let timer2Running = false;
	let timer3Running = false;
	const timer1Time = WAIT_TIME;
	const timer2Time = WAIT_TIME * 2;
	const timer3Time = WAIT_TIME * 3;

	let timer1 = new Timer(() => timer1Running = true, timer1Time, true);
	let timer2 = new Timer(() => timer2Running = true, timer2Time, true);
	let timer3 = new Timer(() => timer3Running = true, timer3Time, true);

	timer1.run();
	timer2.run();
	timer3.run();

	await wait(timer1Time - (timer1Time / 2));
	Timer.clearTimers();
	t.true(!timer1Running);
	await wait(timer2Time - (timer2Time / 2));
	t.true(!timer2Running);
	await wait(timer3Time - (timer3Time / 2));
	t.true(!timer3Running);
});

test.serial(`Will resume all previously paused timers if requested when interval = false. #1`, async t => {
	let timer1Called = false;
	let timer2Called = false;
	const timer1Time = WAIT_TIME;
	const timer2Time = WAIT_TIME * 2;
	let timer1 = new Timer(() => timer1Called = true, timer1Time, false);
	let timer2 = new Timer(() => timer2Called = true, timer2Time, false);

	timer1.run();
	timer2.run();

	await wait(timer1Time - (timer1Time / 2));
	Timer.stopTimers();

	// Assert that no timers has been called yet.
	t.true(!timer1Called && !timer2Called);

	// wait just a bit
	await wait(100);

	Timer.runTimers();

	await wait(timer2Time + (timer2Time / 2));

	// Assert that both timers has been called.
	t.true(timer1Called && timer2Called);
});

test(`Will resume a previously paused timer if requested when interval = false. #1`, async t => {
	let timerCalled = false;
	let firstPromiseResolved = false;
	let secondPromiseResolved = false;
	let timer = new Timer(() => timerCalled = true, WAIT_TIME, false);

	timer.run().then(() => firstPromiseResolved = true);

	await wait(WAIT_TIME - (WAIT_TIME / 2));
	timer.stop();

	// Assert that no timers has been called yet.
	t.true(!timerCalled);

	// wait just a bit
	await wait(100);

	timer.run().then(() => secondPromiseResolved = true);

	await wait(WAIT_TIME + (WAIT_TIME / 2));

	// Assert that the timer has been called.
	t.true(timerCalled);

	// Assert that both 'run()' methods led to the same Promise to be resolved, initiating their callbacks
	t.true(firstPromiseResolved && secondPromiseResolved);
});

test.serial(`Will preserve original Promise if timers are restarted. #1`, async t => {
	let timerPromiseResolved = false;
	let timer = new Timer(() => {}, WAIT_TIME, false);

	timer.run().then(() => timerPromiseResolved = true);

	await wait(WAIT_TIME - (WAIT_TIME / 2));
	Timer.stopTimers();

	// Assert that no timers has been called yet.
	t.true(!timerPromiseResolved);

	// wait just a bit
	await wait(100);

	Timer.runTimers();

	await wait(WAIT_TIME + (WAIT_TIME / 2));

	// Assert that the original Promise has been resolved (even though the timers has been restarted since then.
	t.true(timerPromiseResolved);
});
