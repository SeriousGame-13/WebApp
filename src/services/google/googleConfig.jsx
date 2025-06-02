export const GOOGLE_CONFIG = {
  CLIENT_ID: process.env.REACT_APP_GOOGLE_CLIENT_ID,
  API_KEY: process.env.REACT_APP_GOOGLE_API_KEY,
  DISCOVERY_DOC: 'https://www.googleapis.com/discovery/v1/apis/drive/v3/rest',
  SCOPES: 'https://www.googleapis.com/auth/drive.file'
};

if (!GOOGLE_CONFIG.CLIENT_ID || !GOOGLE_CONFIG.API_KEY) {
  console.error('Google API 환경변수가 누락되었습니다.');
}