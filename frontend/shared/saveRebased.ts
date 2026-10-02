import { RequestError } from "./api";

/** Saves a change made on top of `base`. The server bumps the workspace revision for
    logins, invites and submissions too, so a console left open goes stale on its own.
    When the save is refused as a conflict, load the latest records, build the same change
    on top of them (`send` does that from whatever it is given) and try again. */
export async function saveRebased<S>(base: S, load: () => Promise<S>, send: (from: S) => Promise<S>): Promise<S> {
  let from = base;
  for (let attempt = 0; ; attempt++) {
    try { return await send(from); }
    catch (error) {
      if (!(error instanceof RequestError) || error.status !== 409 || attempt >= 4) throw error;
      from = await load();
    }
  }
}
