/**
 * OpenNext Cloudflare Adapter Configuration
 * https://opennext.js.org/cloudflare
 */
const config = {
  default: {
    override: {
      wrapper: "cloudflare-node",
      converter: "edge",
      incrementalCache: "dummy",
      tagCache: "dummy",
      queue: "dummy",
    },
  },
};

export default config;
