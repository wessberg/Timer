import {ITimer, UUID} from "./interface/ITimer";

/**
 * A private collection of all active Timers
 * @type {Set<ITimer>}
 */
const TIMERS: Set<ITimer> = new Set();

/**
 * A private map between ITimers and UUIDs
 * @type {WeakMap<ITimer, UUID>}
 */
const UUID_MAP: WeakMap<ITimer, UUID> = new WeakMap();

/**
 * A private map between ITimers and Promise-resolve functions
 * @type {WeakMap<ITimer, Function>}
 */
const PROMISE_RESOLVE_FUNCTION_MAP: WeakMap<ITimer, () => void> = new WeakMap();

/**
 * A Timer is a timed task that will either execute once or once per interval.
 * It is essentially 'setTimeout()' and 'setInterval()' for Node and the Browser, except
 * with the additional option to stop and restart individual timers or all timers that is currently active.
 * This is useful for stopping all timers when the app is inactive or is in a state where the timers don't need to run,
 * but you still want to be able to resume them sometime in the future. A 'run()' operation returns a Promise that will resolve
 * either when a timed interval stops or a timed one-off task is executed.
 */
export class Timer implements ITimer {
	public isRunning: boolean = false;

	constructor (private callback: (...args: any[]) => any,
							 private readonly duration: number,
							 private readonly repeat: boolean = false) {
		Timer.addTimer(this);
	}

	/**
	 * Returns true if this Timer instance currently has an active low-level timed task such as 'setInterval' or 'setTimeout'
	 * @returns {boolean}
	 */
	private get hasTimer (): boolean {
		return UUID_MAP.get(this) != null;
	}

	/**
	 * Stops all running timers.
	 * These can be resumed later if requested.
	 * @returns {void}
	 */
	public static stopTimers (): void {
		TIMERS.forEach(timer => Timer.stopTimer(timer));
	}

	/**
	 * Runs all (stopped) timers.
	 * @returns {void}
	 */
	public static runTimers (): void {
		TIMERS.forEach(timer => Timer.runTimer(timer));
	}

	/**
	 * Runs a (stopped) timer.
	 * @param {ITimer} timer
	 * @returns {void}
	 */
	public static runTimer (timer: ITimer): void {
		if (!timer.isRunning) timer.run().then();
	}

	/**
	 * Stops and removes all timers (enables them for garbage collection}
	 * @returns {void}
	 */
	public static clearTimers (): void {
		TIMERS.forEach(timer => Timer.clearTimer(timer));
	}

	/**
	 * Adds a timer to the Map of ITimers.
	 * @param {ITimer} timer
	 * @returns {void}
	 */
	private static addTimer (timer: ITimer): void {
		TIMERS.add(timer);
	}

	/**
	 * Stops a timer if it is running and removes it (marks it for garbage collection)
	 * @param {ITimer} timer
	 * @returns {void}
	 */
	private static clearTimer (timer: ITimer): void {
		Timer.stopTimer(timer);
		TIMERS.delete(timer);
		UUID_MAP.delete(timer);
	}

	/**
	 * Stops the given timer if it is running.
	 * @param {ITimer} timer
	 * @returns {void}
	 */
	private static stopTimer (timer: ITimer): void {
		if (timer.isRunning) timer.stop();
	}

	/**
	 * Starts the timed task.
	 * @returns {Promise<void>}
	 */
	public async run (): Promise<void> {

		// Stop the existing task if a timed task is already associated with this Timer.
		if (this.hasTimer) this.stop();
		this.isRunning = true;

		return new Promise<void>(resolve => {

			// Start an interval or a timeout, depending on the kind of task.
			if (this.repeat) this.startInterval();
			else this.startTimeout();

			// Don't store a reference to the new resolve function if a previous resolve function is already cached and waiting to be called.
			if (PROMISE_RESOLVE_FUNCTION_MAP.get(this) == null) PROMISE_RESOLVE_FUNCTION_MAP.set(this, resolve);
			else resolve();
		});
	}

	/**
	 * Stops a running task.
	 * @returns {void}
	 */
	public stop (): void {
		if (!this.hasTimer) throw new TypeError(`${this.constructor.name} could not stop a timer: It wasn't started or paused!`);
		this.isRunning = false;
		if (this.repeat) this.stopInterval();
		else this.stopTimeout();
	}

	/**
	 * Stops and clears this Timer (marks it for garbage collection)
	 * @returns {void}
	 */
	public clear (): void {
		Timer.clearTimer(this);
	}

	/**
	 * Calls a resolve() function associated with a Promise, if it has one.
	 * @returns {void}
	 */
	private callPromiseResolveFunction (): void {
		const resolveFunction = PROMISE_RESOLVE_FUNCTION_MAP.get(this);

		if (resolveFunction != null) {
			resolveFunction();
			PROMISE_RESOLVE_FUNCTION_MAP.delete(this);
		}
	}

	/**
	 * Starts an interval, using the environments 'setInterval()' implementation (varies between Node and the Browser)
	 * @returns {void}
	 */
	private startInterval (): void {
		UUID_MAP.set(this, setInterval(() => {
			this.callback();
		}, this.duration));
	}

	/**
	 * Starts an interval, using the environments 'setTimeout()' implementation (varies between Node and the Browser)
	 * @returns {void}
	 */
	private startTimeout (): void {
		UUID_MAP.set(this, setTimeout(() => {
			this.callback();

			// The resolve() function will be called when the callback wrapped in the timeout is called.
			// If we were using an interval, the resolve() function would be called only when stop() was called.
			this.callPromiseResolveFunction();
		}, this.duration));
	}

	/**
	 * Stops an interval, using the environments 'clearInterval()' implementation (varies between Node and the Browser)
	 * @returns {void}
	 */
	private stopInterval (): void {
		if (!this.hasTimer) throw new TypeError(`${this.constructor.name} could not stop an interval: It wasn't started!`);
		clearInterval(<number>UUID_MAP.get(this));
		UUID_MAP.delete(this);
		this.callPromiseResolveFunction();
	}

	/**
	 * Stops an interval, using the environments 'clearTimeout()' implementation (varies between Node and the Browser)
	 * @returns {void}
	 */
	private stopTimeout (): void {
		if (!this.hasTimer) throw new TypeError(`${this.constructor.name} could not stop a timeout: It wasn't started!`);
		clearTimeout(<number>UUID_MAP.get(this));
		UUID_MAP.delete(this);
	}

}