export class UploadController {
    constructor() {
        this.status = 'uploading';
        this.abortControllers = new Set();
    }

    pause() {
        this.status = 'paused';
    }

    resume() {
        this.status = 'uploading';
    }

    stop() {
        this.status = 'stopped';
        this.abortControllers.forEach(controller => {
            try {
                controller.abort();
            } catch (e) {
                console.error('Error aborting request:', e);
            }
        });
        this.abortControllers.clear();
    }

    addAbortController(controller) {
        this.abortControllers.add(controller);
    }

    removeAbortController(controller) {
        this.abortControllers.delete(controller);
    }

    isPaused() {
        return this.status === 'paused';
    }

    isStopped() {
        return this.status === 'stopped';
    }
}
