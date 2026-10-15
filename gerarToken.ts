import { google } from 'googleapis';
import * as fs from 'fs';
import * as readline from 'readline';

const ENV_PATH = '.env';

// Lê o client ID/secret do arquivo ".env" (formato CHAVE=valor)
function lerEnv(caminho: string): Record<string, string> {
  const vars: Record<string, string> = {};
  for (const linha of fs.readFileSync(caminho, 'utf8').split(/\r?\n/)) {
    const match = linha.match(/^\s*([A-Z_]+)\s*=\s*(.*)\s*$/);
    if (match && match[1] && match[2]) {
      vars[match[1]] = match[2].replace(/^["']|["']$/g, '');
    }
  }
  return vars;
}

async function main() {
  const env = lerEnv(ENV_PATH);
  const clientId = env.GMAIL_CLIENT_ID;
  const clientSecret = env.GMAIL_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    console.error('GMAIL_CLIENT_ID e GMAIL_CLIENT_SECRET não encontrados no arquivo ".env".');
    process.exit(1);
  }

  const oAuth2Client = new google.auth.OAuth2(clientId, clientSecret, 'http://localhost');

  // Gera a URL de autorização exigindo o acesso offline (que devolve o refresh_token)
  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent',
    scope: ['https://www.googleapis.com/auth/gmail.readonly'],
  });

  console.log('1. Clique neste link para autorizar o app:', authUrl);
  console.log('\n2. Após aceitar, você será redirecionado para uma página de erro (localhost).');
  console.log('3. Olhe a URL no seu navegador e copie APENAS o código que vem depois de "?code=" (e antes do "&scope").');

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  rl.question('\nCole o código da URL aqui: ', async (code) => {
    try {
      // O código vindo da URL costuma vir com "%2F" no lugar das barras, então decodificamos
      const decodedCode = decodeURIComponent(code);
      const { tokens } = await oAuth2Client.getToken(decodedCode);

      console.log('\n✅ SUCESSO! Copie o seu Refresh Token abaixo:\n');
      console.log(`GMAIL_REFRESH_TOKEN=${tokens.refresh_token}`);
      console.log('\nAtualize a linha GMAIL_REFRESH_TOKEN no arquivo ".env" e me avise para eu atualizar a Vercel.');
    } catch (error) {
      console.error('Erro ao resgatar o token:', error);
    }
    rl.close();
  });
}

main();
