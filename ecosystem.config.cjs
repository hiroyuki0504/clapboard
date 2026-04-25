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
