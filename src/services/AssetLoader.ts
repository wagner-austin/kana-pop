export type Task = () => Promise<void>;

class AssetLoader {
  private tasks: Task[] = [];
  add(t: Task) {
    this.tasks.push(t);
  }
  /**
   * Run tasks sequentially or in parallel (your choice).
   * Emits 0‥1 progress through `onStep`.
   */
  async run(onStep: (p: number) => void, parallel = true) {
    if (this.tasks.length === 0) {
      onStep(1); // No tasks, progress is 100%
      return;
    }

    if (parallel) {
      let done = 0;
      await Promise.all(
        this.tasks.map((t) =>
          t!().then(() => {
            // Use non-null assertion for t
            onStep(++done / this.tasks.length);
          }),
        ),
      );
    } else {
      for (let i = 0; i < this.tasks.length; i++) {
        const task = this.tasks[i];
        await task!(); // Use non-null assertion for task
        onStep((i + 1) / this.tasks.length);
      }
    }
    /* clear so next boot doesn’t rerun same tasks */
    this.tasks = [];
  }
}

export default new AssetLoader();
