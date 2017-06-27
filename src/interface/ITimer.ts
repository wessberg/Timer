export interface ITimer {
	isRunning: boolean;
	run (): Promise<void>;
	stop (): void;
	clear (): void;
}

export declare type UUID = number|null|NodeJS.Timer;

export interface ITimerConstructable {
	runTimer (timer: ITimer): void;
	runTimers (): void;
	stopTimers (): void;
	stopTimer (timer: ITimer): void;
	clearTimer (timer: ITimer): void;
	clearTimers (): void;
	new (callback: (...args: any[]) => any, duration: number, repeat?: boolean): ITimer;
}