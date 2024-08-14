import { env } from 'process';

const config = {
    host: env.REACT_APP_API_URL || 'http://localhost:3000/',
  // 其他配置...
};

export default config;