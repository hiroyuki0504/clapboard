// ecosystem.config.cjs — PM2 プロセス設定 (Mac mini 本番用)
// 使い方: pm2 start ecosystem.config.cjs --env production

module.exports = {
  apps: [
    {
      name: "clapboard",
      script: "node_modules/.bin/next",
      args: "start",
      cwd: __dirname,

      // 環境変数
      env: {
        NODE_ENV: "development",
        PORT: 3000,
      },
      env_production: {
        NODE_ENV: "production",
        PORT: 3000,
        // 機密値は GitHub Actions secrets / vars から process.env に注入される。
        // pm2 start --update-env でこの内容が更新される。
        CLAPBOARD_SESSION_SECRET: process.env.CLAPBOARD_SESSION_SECRET,
        CLAPBOT_FILES_ROOT: process.env.CLAPBOT_FILES_ROOT,
      },

      // プロセス管理
      instances: 1,          // Next.js は 1 インスタンス推奨 (cluster mode 非対応)
      exec_mode: "fork",
      autorestart: true,
      watch: false,          // ファイル監視は不要 (deploy 時に reload)
      max_memory_restart: "512M",

      // ログ
      out_file: "logs/out.log",
      error_file: "logs/error.log",
      merge_logs: true,
      log_date_format: "YYYY-MM-DD HH:mm:ss",
    },
  ],
};
