export function escapeRegExp(input) {
  return input.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&");
}
