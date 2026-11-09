// Turn a failed HTTP response into an Error that says what the provider actually replied.
export async function failed(res, what) {
  const body = await res.text().catch(() => "");
  const err = new Error(`${what} failed (${res.status}). ${body.replace(/\s+/g, " ").slice(0, 220)}`.trim());
  err.status = res.status;
  return err;
}
