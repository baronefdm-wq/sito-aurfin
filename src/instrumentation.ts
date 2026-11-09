/** Avvia le attività periodiche una sola volta per processo del server. */
export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  const state = globalThis as unknown as { __aurfinJobs?: boolean };
  if (state.__aurfinJobs) return;
  state.__aurfinJobs = true;

  const run = async () => {
    try {
      const { runMaintenance } = await import("@/lib/server/jobs");
      await runMaintenance();
    } catch (err) {
      console.error("Attività periodiche non riuscite:", err);
    }
  };
  setTimeout(run, 60_000).unref();
  setInterval(run, 60 * 60_000).unref();
}
