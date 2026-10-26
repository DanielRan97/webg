import { cleanUp, db } from "./db";

/** Global setup and teardown: removes test accounts left by an earlier, interrupted run, and this run's. */
export default async function globalCleanUp() {
  await cleanUp();
  await db.$disconnect();
}
