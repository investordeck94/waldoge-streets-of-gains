// Bark Zero — X (Twitter) publish endpoint
// Publishes a tweet or thread using OAuth 1.0a User Context (required to post as a user).
// Expects secrets: BARK_ZERO_X_CONSUMER_KEY, BARK_ZERO_X_CONSUMER_SECRET,
//                  BARK_ZERO_X_ACCESS_TOKEN, BARK_ZERO_X_ACCESS_TOKEN_SECRET
// If credentials are missing, returns a clear "not_connected" response so the UI can prompt setup.

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-owner-secret",
};

const X_API = "https://api.x.com/2/tweets";

// —— OAuth 1.0a signing helpers (no third-party deps) ——
function percentEncode(v: string) {
  return encodeURIComponent(v).replace(/[!*'()]/g, (c) => `%${c.charCodeAt(0).toString(16).toUpperCase()}`);
}

async function hmacSha1Base64(key: string, message: string): Promise<string> {
  const enc = new TextEncoder();
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    enc.encode(key),
    { name: "HMAC", hash: "SHA-1" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", cryptoKey, enc.encode(message));
  return btoa(String.fromCharCode(...new Uint8Array(sig)));
}

async function buildOAuthHeader(opts: {
  method: string;
  url: string;
  consumerKey: string;
  consumerSecret: string;
  token: string;
  tokenSecret: string;
}): Promise<string> {
  const oauthParams: Record<string, string> = {
    oauth_consumer_key: opts.consumerKey,
    oauth_nonce: crypto.randomUUID().replace(/-/g, ""),
    oauth_signature_method: "HMAC-SHA1",
    oauth_timestamp: Math.floor(Date.now() / 1000).toString(),
    oauth_token: opts.token,
    oauth_version: "1.0",
  };

  // NOTE: For X v2 with JSON body, only OAuth params go into the signature base.
  const paramString = Object.keys(oauthParams)
    .sort()
    .map((k) => `${percentEncode(k)}=${percentEncode(oauthParams[k])}`)
    .join("&");

  const signatureBase = [
    opts.method.toUpperCase(),
    percentEncode(opts.url),
    percentEncode(paramString),
  ].join("&");

  const signingKey = `${percentEncode(opts.consumerSecret)}&${percentEncode(opts.tokenSecret)}`;
  const signature = await hmacSha1Base64(signingKey, signatureBase);

  const headerParams = { ...oauthParams, oauth_signature: signature };
  return "OAuth " + Object.keys(headerParams)
    .sort()
    .map((k) => `${percentEncode(k)}="${percentEncode(headerParams[k])}"`)
    .join(", ");
}

async function postTweet(text: string, replyToId: string | null, creds: {
  consumerKey: string; consumerSecret: string; token: string; tokenSecret: string;
}) {
  const authHeader = await buildOAuthHeader({
    method: "POST",
    url: X_API,
    ...creds,
  });

  const body: Record<string, unknown> = { text };
  if (replyToId) body.reply = { in_reply_to_tweet_id: replyToId };

  const res = await fetch(X_API, {
    method: "POST",
    headers: {
      Authorization: authHeader,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(`X API ${res.status}: ${JSON.stringify(json)}`);
  }
  return json?.data?.id as string | undefined;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const consumerKey = Deno.env.get("BARK_ZERO_X_CONSUMER_KEY");
    const consumerSecret = Deno.env.get("BARK_ZERO_X_CONSUMER_SECRET");
    const token = Deno.env.get("BARK_ZERO_X_ACCESS_TOKEN");
    const tokenSecret = Deno.env.get("BARK_ZERO_X_ACCESS_TOKEN_SECRET");

    if (!consumerKey || !consumerSecret || !token || !tokenSecret) {
      return new Response(
        JSON.stringify({
          status: "not_connected",
          message: "Bark Zero's X account is not connected yet. Add BARK_ZERO_X_* API credentials to enable publishing.",
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const { kind, text, posts } = await req.json();
    const creds = { consumerKey, consumerSecret, token, tokenSecret };

    if (kind === "tweet" || kind === "reply") {
      if (typeof text !== "string" || text.trim().length === 0) {
        return new Response(JSON.stringify({ error: "text required" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const id = await postTweet(text, null, creds);
      return new Response(JSON.stringify({ status: "published", ids: [id] }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (kind === "thread") {
      if (!Array.isArray(posts) || posts.length === 0) {
        return new Response(JSON.stringify({ error: "posts array required" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const ids: string[] = [];
      let prev: string | null = null;
      for (const p of posts) {
        const id = await postTweet(String(p), prev, creds);
        if (!id) throw new Error("X API did not return an id");
        ids.push(id);
        prev = id;
      }
      return new Response(JSON.stringify({ status: "published", ids }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "kind must be tweet | reply | thread" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("bark-zero-x-publish error:", err);
    return new Response(
      JSON.stringify({ status: "error", error: err instanceof Error ? err.message : String(err) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
