// One-shot diagnostic: authenticated GET to the documented Anoncoin endpoint.
// Uses the server-side ANONCOIN_API_KEY. Never returns the key itself.
const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });

  const key = Deno.env.get("ANONCOIN_API_KEY") ?? "";
  const keyPresent = key.length > 0;

  const url = "https://api.anoncoin.it/services/v2/create-coin-tx";
  const method = "POST";
  const form = new FormData();
  form.append("tickerName", "ProbeTest");
  form.append("tickerSymbol", "PROBE");
  form.append("description", "probe");
  form.append("validateOnly", "true");

  const started = new Date().toISOString();
  let status = 0;
  let headers: Record<string, string> = {};
  let body = "";
  let exception: string | null = null;

  try {
    const res = await fetch(url, {
      method,
      headers: { "x-api-key": key },
      body: form,
    });
    status = res.status;
    res.headers.forEach((v, k) => (headers[k] = v));
    body = await res.text();
  } catch (e) {
    exception = (e as Error).message;
  }

  return new Response(
    JSON.stringify({
      probedAt: started,
      url,
      method,
      apiKeyUsed: keyPresent,
      apiKeyLength: key.length,
      status,
      headers,
      body: body.slice(0, 2000),
      exception,
    }, null, 2),
    { headers: { ...cors, "Content-Type": "application/json" } },
  );
});
