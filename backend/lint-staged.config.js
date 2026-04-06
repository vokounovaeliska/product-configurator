/** Paths relative to this file. Avoids “no staged files matching” on Kotlin-only commits. */
export default {
  "**/*.kt": () => "true",
}
