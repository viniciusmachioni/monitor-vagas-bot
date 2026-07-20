import { google } from 'googleapis';
import * as fs from 'fs';

// Troca o código de autorização pelo refresh token e grava no .env sem exibi-lo
const code = process.argv[2];
if (!code) {
  console.error('Uso: npx ts-node trocarToken.ts <codigo>');
  process.exit(1);
}

const envRaw = fs.readFileSync('.env', 'utf8');
const pegar = (chave: string) => {
  const m = envRaw.match(new RegExp(`^${chave}\\s*=\\s*(.*)$`, 'm'));
  return m && m[1] ? m[1].trim().replace(/^["']|["']$/g, '') : '';
};

const oAuth2Client = new google.auth.OAuth2(
  pegar('GMAIL_CLIENT_ID'),
  pegar('GMAIL_CLIENT_SECRET'),
  'http://localhost'
);

oAuth2Client.getToken(decodeURIComponent(code)).then(({ tokens }) => {
  if (!tokens.refresh_token) {
    console.error('Google não devolveu refresh_token. Resposta continha:', Object.keys(tokens).join(', '));
    process.exit(1);
  }
  const atualizado = envRaw.replace(
    /^GMAIL_REFRESH_TOKEN\s*=.*$/m,
    `GMAIL_REFRESH_TOKEN="${tokens.refresh_token}"`
  );
  fs.writeFileSync('.env', atualizado);
  console.log('✅ Refresh token gravado no .env com sucesso.');
}).catch((err) => {
  console.error('Erro ao trocar o código:', err.response?.data || err.message);
  process.exit(1);
});
