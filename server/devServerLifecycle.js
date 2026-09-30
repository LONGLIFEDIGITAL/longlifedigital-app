// Vite can receive config-watch restarts while async buildStart hooks are still
// running. Closing a not-yet-listening HTTP server does not cancel its pending
// listen(), leaving a stale listener when that first startup eventually finishes.
export function devServerLifecyclePlugin() {
  return {
    name: 'stable-dev-server-lifecycle',
    configureServer(server) {
      const http = server.httpServer;
      if (!http) return;
      const listening = new Promise((resolve) => {
        const finish = (ready) => {
          http.off('listening', onListening);
          http.off('error', onError);
          http.off('close', onClose);
          resolve(ready);
        };
        const onListening = () => finish(true);
        const onError = () => finish(false);
        const onClose = () => finish(false);
        http.once('listening', onListening);
        http.once('error', onError);
        http.once('close', onClose);
      });
      const restart = server.restart;
      server.restart = async (...args) => {
        if (await listening) return restart(...args);
      };
    },
  };
}
