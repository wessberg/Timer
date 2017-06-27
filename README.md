# Timer [![NPM version][npm-image]][npm-url]
> A Timer is a timed task that will either execute once or once per interval. It is essentially `setTimeout()` and `setInterval()` for Node and the Browser, except with the additional option to stop and restart individual timers or all timers that is currently active. This is useful for stopping all Timers when the app is inactive or is in a state where the Timers don't need to run, but you still want to be able to resume them sometime in the future. A `run()` operation returns a Promise that will resolve either when a timed interval stops or a timed one-off task is executed.

## Installation
Simply do: `npm install @wessberg/timer`.

## Usage

Here's a very basic example of how to use a Timer:

```typescript
const duration = 1000;
const repeat = true;
const timer = new Timer(getNewTodos, duration, repeat);

timer.run();
```

Where the Timer library becomes truly useful, though, is when you want to stop or restart individual or all timers.
For example:

```typescript
timer.run();

// ...Sometime in the future.
timer.stop();
whenSomethingHappens(() => timer.run());
appGetsInactive(() => Timer.stopTimers());
appGetsActiveAgain(() => Timer.runTimers())
```

Every call to `run()` returns a Promise that will be resolved when the timed task has executed:

- For repeated/interval tasks (`setInterval`-style), the Promise is resolved when the repeated task is stopped, either by calling `stop()` or by stopping or clearing all timers.
- For timed, simple one-off tasks (`setTimeout`-style), the Promise is resolved when the timed task is executed.

This means that if a Task is stopped and then resumed, the Promise that was returned from the original call to `run()` will still be resolved! This way, you can ensure that your code will run like you expect.
For example:

```typescript
async function taskRunner () {
	await timer.run();
	console.log("The timer has the timed task run!");
}

async function main () {
	taskRunner();
	
	// when 'stop' is called, the Promise will not resolve yet if the task hasn't yet executed (and isn't a repeated task)
	afterSomeTime(() => timer.stop());
	
	// When the timer finally runs, the Promise will be resolved.
	// "The timer has the timed task run!" will be printed to the console by then.
	afterSomeMoreTime(() => timer.run());
	
}
```

## Changelog:

**v1.0.0**:

- First release.

[npm-url]: https://npmjs.org/package/@wessberg/timer
[npm-image]: https://badge.fury.io/js/@wessberg/timer.svg