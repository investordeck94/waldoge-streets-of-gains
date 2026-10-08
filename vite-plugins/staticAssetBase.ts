import type { Plugin } from "vite";

/**
 * Asset-delivery switch. When VITE_ASSET_BASE is set (standalone builds), the
 * `url` of every imported *.asset.json is rewritten from Lovable's hosted
 * `/__l5e/assets-v1/<id>/<file>` to `${VITE_ASSET_BASE}/assets-v1/<id>/<file>`.
 * When unset (Lovable preview/live), this plugin is a no-op.
 * Only the url string changes — artwork, dimensions and game code are untouched.
 */
export function staticAssetBase(base: string | undefined): Plugin {
  return {
    name: "static-asset-base",
    enforce: "pre",
    transform(code, id) {
      if (base === undefined || !id.split("?")[0].endsWith(".asset.json")) return null;
      const prefix = base.replace(/\/+$/, "");
      const data = JSON.parse(code);
      if (typeof data.url !== "string" || !data.url.startsWith("/__l5e/assets-v1/")) return null;
      data.url = prefix + data.url.slice("/__l5e".length);
      return { code: JSON.stringify(data), map: null };
    },
  };
}
