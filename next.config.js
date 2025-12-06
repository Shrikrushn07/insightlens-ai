/** @type {import('next').NextConfig} */
module.exports = {
  webpack: (config, { isServer }) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      'canvas': false,
    }
    return config
  },
}
